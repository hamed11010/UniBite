'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { checkAuth, hasRole } from '@/lib/auth'
import { APP_ROUTE } from '@/lib/redirectByRole'
import {
  fetchAllUniversities,
  createUniversity,
  updateUniversity,
  toggleUniversityStatus,
  createRestaurant,
  fetchAllRestaurants,
  fetchRestaurantsByUniversity,
  type University,
  type CreateUniversityDto,
  type UpdateUniversityDto,
  type CreateRestaurantDto,
  type Restaurant,
  type GlobalConfig,
  type ServiceFeeAnalyticsResponse,
  fetchGlobalConfig,
  updateGlobalConfig,
  fetchServiceFeeAnalytics,
  fetchEscalatedReportsForAdmin,
  fetchAutoDisabledRestaurants,
  reEnableRestaurant,
  type EscalatedReport,
  type AutoDisabledRestaurant,
} from '@/lib/api'
import { logout } from '@/lib/api'
import styles from './admin.module.css'
import AdminMonthlyOrdersPanel from '@/components/AdminMonthlyOrdersPanel'

export default function PlatformAdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [universities, setUniversities] = useState<University[]>([])
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUniversity, setNewUniversity] = useState<CreateUniversityDto>({
    name: '',
    allowedEmailDomains: [''],
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingUniversityId, setEditingUniversityId] = useState<string | null>(null)
  const [editUniversity, setEditUniversity] = useState<UpdateUniversityDto>({
    name: '',
    allowedEmailDomains: [],
  })
  const [showRestaurantForm, setShowRestaurantForm] = useState(false)
  const [newRestaurant, setNewRestaurant] = useState<CreateRestaurantDto>({
    name: '',
    universityId: '',
    responsibleName: '',
    responsiblePhone: '',
    adminEmail: '',
    adminPassword: '',
  })
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)
  const [loadingAllRestaurants, setLoadingAllRestaurants] = useState(false)
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null)
  const [savingConfig, setSavingConfig] = useState(false)
  const [serviceFeeAnalytics, setServiceFeeAnalytics] = useState<ServiceFeeAnalyticsResponse | null>(
    null,
  )
  const [loadingServiceFeeAnalytics, setLoadingServiceFeeAnalytics] = useState(false)
  const [activeSection, setActiveSection] = useState<
    'overview' | 'universities' | 'restaurants' | 'orders' | 'serviceFee' | 'reports'
  >('overview')
  const [escalatedReports, setEscalatedReports] = useState<EscalatedReport[]>([])
  const [autoDisabledRestaurants, setAutoDisabledRestaurants] = useState<AutoDisabledRestaurant[]>([])
  const [loadingGovernance, setLoadingGovernance] = useState(false)
  const [reEnablingRestaurantId, setReEnablingRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Cookie-based authentication check - single source of truth
    const verifyAuth = async () => {
      const user = await checkAuth()

      if (!user || !hasRole(user, 'SUPER_ADMIN')) {
        router.push('/auth/login')
        return
      }

      // User is authenticated and has correct role - load dashboard data
      await loadUniversities()
      await loadGlobalConfig()
    }

    verifyAuth()
  }, [router])

  const loadUniversities = async () => {
    try {
      setLoading(true)
      const data = await fetchAllUniversities(true) // Include inactive
      setUniversities(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load universities')
    } finally {
      setLoading(false)
    }
  }

  const loadGlobalConfig = async () => {
    try {
      const config = await fetchGlobalConfig()
      setGlobalConfig(config)
    } catch (err) {
      console.error('Failed to load global config', err)
    }
  }

  const loadServiceFeeAnalytics = useCallback(async () => {
    setLoadingServiceFeeAnalytics(true)
    try {
      const analytics = await fetchServiceFeeAnalytics()
      setServiceFeeAnalytics(analytics)
    } catch (error) {
      console.error('Failed to load service fee analytics', error)
      setServiceFeeAnalytics(null)
    } finally {
      setLoadingServiceFeeAnalytics(false)
    }
  }, [])

  const loadGovernanceData = useCallback(async () => {
    setLoadingGovernance(true)
    try {
      const [reports, autoDisabled] = await Promise.all([
        fetchEscalatedReportsForAdmin(),
        fetchAutoDisabledRestaurants(),
      ])
      setEscalatedReports(Array.isArray(reports) ? reports : [])
      setAutoDisabledRestaurants(Array.isArray(autoDisabled) ? autoDisabled : [])
    } catch (error) {
      console.error('Failed to load governance data', error)
      setEscalatedReports([])
      setAutoDisabledRestaurants([])
    } finally {
      setLoadingGovernance(false)
    }
  }, [])

  const handleUpdateConfig = async () => {
    if (!globalConfig) return
    setSavingConfig(true)
    setError('')
    setSuccess('')
    try {
      await updateGlobalConfig({
        serviceFeeEnabled: globalConfig.serviceFeeEnabled,
        serviceFeeAmount: Number(globalConfig.serviceFeeAmount),
        orderingEnabled: globalConfig.orderingEnabled,
        maintenanceMode: globalConfig.maintenanceMode,
        maintenanceMessage: globalConfig.maintenanceMessage,
      })
      await loadGlobalConfig()
      if (activeSection === 'serviceFee') {
        await loadServiceFeeAnalytics()
      }
      setSuccess('Settings updated successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to update settings')
    } finally {
      setSavingConfig(false)
    }
  }

  const handleAddUniversity = async () => {
    setError('')
    setSuccess('')

    // Validation
    if (!newUniversity.name.trim()) {
      setError('University name is required')
      return
    }

    const validDomains = newUniversity.allowedEmailDomains
      .map((d) => d.trim())
      .filter((d) => d.length > 0)

    if (validDomains.length === 0) {
      setError('At least one email domain is required')
      return
    }

    // Ensure domains start with @
    const formattedDomains = validDomains.map((domain) => {
      if (!domain.startsWith('@')) {
        return `@${domain}`
      }
      return domain
    })

    try {
      await createUniversity({
        name: newUniversity.name.trim(),
        allowedEmailDomains: formattedDomains,
      })

      setSuccess('University created successfully!')
      setNewUniversity({ name: '', allowedEmailDomains: [''] })
      setShowAddForm(false)
      await loadUniversities() // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to create university')
    }
  }

  const loadRestaurants = useCallback(
    async (universityId: string) => {
      try {
        setLoadingRestaurants(true)
        const data = await fetchRestaurantsByUniversity(universityId)
        setRestaurants(data)
      } catch (err: any) {
        console.error('Failed to load restaurants:', err)
      } finally {
        setLoadingRestaurants(false)
      }
    },
    [],
  )

  const loadAllRestaurants = useCallback(async () => {
    try {
      setLoadingAllRestaurants(true)
      const data = await fetchAllRestaurants()
      setAllRestaurants(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load all restaurants', err)
      setAllRestaurants([])
    } finally {
      setLoadingAllRestaurants(false)
    }
  }, [])

  useEffect(() => {
    // Load restaurants when university is selected
    if (selectedUniversityId !== 'all' && selectedUniversityId) {
      loadRestaurants(selectedUniversityId)
      // Update restaurant form universityId if form is open
      if (showRestaurantForm) {
        setNewRestaurant((prev) => ({
          ...prev,
          universityId: selectedUniversityId,
        }))
      }
    } else {
      setRestaurants([])
    }
  }, [selectedUniversityId, showRestaurantForm, loadRestaurants])

  useEffect(() => {
    const section = searchParams.get('section')
    if (
      section === 'overview' ||
      section === 'universities' ||
      section === 'restaurants' ||
      section === 'orders' ||
      section === 'serviceFee' ||
      section === 'reports'
    ) {
      setActiveSection(section)
    }
  }, [searchParams])

  useEffect(() => {
    if (activeSection !== 'serviceFee') return
    void loadServiceFeeAnalytics()
  }, [activeSection, loadServiceFeeAnalytics])

  useEffect(() => {
    if (activeSection !== 'orders') return
    void loadAllRestaurants()
  }, [activeSection, loadAllRestaurants])

  useEffect(() => {
    if (activeSection !== 'reports') return

    void loadGovernanceData()
    const interval = window.setInterval(() => {
      void loadGovernanceData()
    }, 15000)

    return () => window.clearInterval(interval)
  }, [activeSection, loadGovernanceData])

  const handleEditUniversity = (university: University) => {
    setEditingUniversityId(university.id)
    setEditUniversity({
      name: university.name,
      allowedEmailDomains: [...university.allowedEmailDomains],
    })
    setError('')
    setSuccess('')
  }

  const handleCancelEdit = () => {
    setEditingUniversityId(null)
    setEditUniversity({ name: '', allowedEmailDomains: [] })
  }

  const handleUpdateUniversity = async (id: string) => {
    setError('')
    setSuccess('')

    if (!editUniversity.name?.trim()) {
      setError('University name is required')
      return
    }

    const validDomains = (editUniversity.allowedEmailDomains || [])
      .map((d) => d.trim())
      .filter((d) => d.length > 0)

    if (validDomains.length === 0) {
      setError('At least one email domain is required')
      return
    }

    const formattedDomains = validDomains.map((domain) => {
      if (!domain.startsWith('@')) {
        return `@${domain}`
      }
      return domain
    })

    try {
      await updateUniversity(id, {
        name: editUniversity.name.trim(),
        allowedEmailDomains: formattedDomains,
      })
      setSuccess('University updated successfully!')
      setEditingUniversityId(null)
      await loadUniversities()
    } catch (err: any) {
      setError(err.message || 'Failed to update university')
    }
  }

  const handleAddRestaurant = async () => {
    setError('')
    setSuccess('')

    // Validation
    if (!newRestaurant.name.trim()) {
      setError('Restaurant name is required')
      return
    }
    if (!newRestaurant.universityId) {
      setError('University is required')
      return
    }
    if (!newRestaurant.responsibleName.trim()) {
      setError('Responsible person name is required')
      return
    }
    if (!newRestaurant.responsiblePhone.trim()) {
      setError('Responsible phone number is required')
      return
    }
    if (!newRestaurant.adminEmail.trim()) {
      setError('Admin email is required')
      return
    }
    if (!newRestaurant.adminPassword || newRestaurant.adminPassword.length < 8) {
      setError('Admin password must be at least 8 characters')
      return
    }

    try {
      await createRestaurant(newRestaurant)
      setSuccess('Restaurant and admin account created successfully!')
      setNewRestaurant({
        name: '',
        universityId: selectedUniversityId !== 'all' ? selectedUniversityId : '',
        responsibleName: '',
        responsiblePhone: '',
        adminEmail: '',
        adminPassword: '',
      })
      setShowRestaurantForm(false)
      await loadUniversities() // Refresh to update restaurant count
      if (selectedUniversityId !== 'all') {
        await loadRestaurants(selectedUniversityId)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create restaurant')
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleUniversityStatus(id, !currentStatus)
      await loadUniversities() // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to update university status')
    }
  }

  const handleReEnableRestaurant = async (restaurantId: string) => {
    setError('')
    setSuccess('')
    setReEnablingRestaurantId(restaurantId)
    try {
      await reEnableRestaurant(restaurantId)
      setSuccess('Restaurant re-enabled successfully')
      await loadGovernanceData()
      if (selectedUniversityId !== 'all') {
        await loadRestaurants(selectedUniversityId)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to re-enable restaurant')
    } finally {
      setReEnablingRestaurantId(null)
    }
  }

  const handleAddDomain = () => {
    setNewUniversity({
      ...newUniversity,
      allowedEmailDomains: [...newUniversity.allowedEmailDomains, ''],
    })
  }

  const handleRemoveDomain = (index: number) => {
    const newDomains = newUniversity.allowedEmailDomains.filter((_, i) => i !== index)
    if (newDomains.length === 0) {
      newDomains.push('')
    }
    setNewUniversity({
      ...newUniversity,
      allowedEmailDomains: newDomains,
    })
  }

  const handleDomainChange = (index: number, value: string) => {
    const newDomains = [...newUniversity.allowedEmailDomains]
    newDomains[index] = value
    setNewUniversity({
      ...newUniversity,
      allowedEmailDomains: newDomains,
    })
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    router.push(APP_ROUTE.ROOT)
  }

  const selectedUniversity = universities.find((u) => u.id === selectedUniversityId)
  const selectedOrdersRestaurantId = searchParams.get('restaurantId') || undefined
  const displayedUniversities =
    selectedUniversityId === 'all' ? universities : selectedUniversity ? [selectedUniversity] : []

  // Calculate aggregate stats
  const totalRestaurants = displayedUniversities.reduce((sum, u) => sum + (u.restaurantCount || 0), 0)
  const totalUsers = displayedUniversities.reduce((sum, u) => sum + (u.userCount || 0), 0)
  const activeUniversities = displayedUniversities.filter((u) => u.isActive).length
  const formatCurrency = (value: number) => `${value.toFixed(2)} EGP`

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Super Admin Dashboard</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.dashboardContainer}>
          <main className={styles.mainContent}>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            {activeSection === 'overview' && (
              <>
        {/* Global Settings */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Global Settings</h2>
          {globalConfig && (
            <div className={styles.addForm}>
              <div className={styles.checkboxContainer} style={{ marginBottom: '1rem' }}>
                <label className={styles.label}>
                  <input
                    type="checkbox"
                    checked={globalConfig.serviceFeeEnabled}
                    onChange={(e) =>
                      setGlobalConfig({
                        ...globalConfig!,
                        serviceFeeEnabled: e.target.checked,
                      })
                    }
                    style={{ marginRight: '8px' }}
                  />
                  Enable Service Fee
                </label>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className={styles.label}>Service Fee Amount (EGP)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={globalConfig.serviceFeeAmount}
                  onChange={(e) =>
                    setGlobalConfig({
                      ...globalConfig!,
                      serviceFeeAmount: Number(e.target.value),
                    })
                  }
                  className={styles.input}
                  disabled={!globalConfig.serviceFeeEnabled}
                />
              </div>

              <div className={styles.checkboxContainer} style={{ marginBottom: '1rem' }}>
                <label className={styles.label}>
                  <input
                    type="checkbox"
                    checked={globalConfig.orderingEnabled}
                    onChange={(e) =>
                      setGlobalConfig({
                        ...globalConfig!,
                        orderingEnabled: e.target.checked,
                      })
                    }
                    style={{ marginRight: '8px' }}
                  />
                  Ordering Enabled (Uncheck to stop all new orders)
                </label>
              </div>

              <div className={styles.checkboxContainer} style={{ marginBottom: '1rem' }}>
                <label className={styles.label}>
                  <input
                    type="checkbox"
                    checked={globalConfig.maintenanceMode}
                    onChange={(e) =>
                      setGlobalConfig({
                        ...globalConfig!,
                        maintenanceMode: e.target.checked,
                      })
                    }
                    style={{ marginRight: '8px' }}
                  />
                  Maintenance Mode (Students see maintenance page)
                </label>
              </div>

              {globalConfig.maintenanceMode && (
                <div style={{ marginBottom: '1rem' }}>
                  <label className={styles.label}>Maintenance Message</label>
                  <input
                    type="text"
                    value={globalConfig.maintenanceMessage || ''}
                    onChange={(e) =>
                      setGlobalConfig({
                        ...globalConfig!,
                        maintenanceMessage: e.target.value,
                      })
                    }
                    className={styles.input}
                    placeholder="We will be back shortly..."
                  />
                </div>
              )}
              <button
                onClick={handleUpdateConfig}
                className={styles.submitButton}
                disabled={savingConfig}
              >
                {savingConfig ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          )}
        </div>

        {/* University Selector */}
        <div className={styles.restaurantSelector}>
          <label className={styles.selectorLabel}>View:</label>
          <select
            value={selectedUniversityId}
            onChange={(e) => setSelectedUniversityId(e.target.value)}
            className={styles.selectorDropdown}
          >
            <option value="all">All Universities</option>
            {universities.map((university) => (
              <option key={university.id} value={university.id}>
                {university.name}
              </option>
            ))}
          </select>
          {selectedUniversityId !== 'all' && selectedUniversity && (
            <p className={styles.selectedRestaurantNote}>
              Viewing: {selectedUniversity.name}
            </p>
          )}
        </div>

        {/* University Statistics */}
        <div className={styles.overviewSection}>
          <h2 className={styles.sectionTitle}>University Statistics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {selectedUniversityId === 'all' ? universities.length : 1}
              </div>
              <div className={styles.statLabel}>
                {selectedUniversityId === 'all' ? 'Total Universities' : 'University'}
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{activeUniversities}</div>
              <div className={styles.statLabel}>Active Universities</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{totalRestaurants}</div>
              <div className={styles.statLabel}>Total Restaurants</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{totalUsers}</div>
              <div className={styles.statLabel}>Total Users (Students)</div>
            </div>
          </div>
        </div>

              </>
            )}

            {activeSection === 'universities' && (
              <>
        {/* University Selector */}
        <div className={styles.restaurantSelector}>
          <label className={styles.selectorLabel}>View:</label>
          <select
            value={selectedUniversityId}
            onChange={(e) => setSelectedUniversityId(e.target.value)}
            className={styles.selectorDropdown}
          >
            <option value="all">All Universities</option>
            {universities.map((university) => (
              <option key={university.id} value={university.id}>
                {university.name}
              </option>
            ))}
          </select>
          {selectedUniversityId !== 'all' && selectedUniversity && (
            <p className={styles.selectedRestaurantNote}>
              Viewing: {selectedUniversity.name}
            </p>
          )}
        </div>

        {/* University Management */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>University Management</h2>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm)
                setError('')
                setSuccess('')
              }}
              className={styles.addButton}
            >
              {showAddForm ? 'Cancel' : '+ Add University'}
            </button>
          </div>

          {showAddForm && (
            <div className={styles.addForm}>
              <h3 className={styles.formTitle}>Create New University</h3>
              <input
                type="text"
                placeholder="University name"
                value={newUniversity.name}
                onChange={(e) =>
                  setNewUniversity({ ...newUniversity, name: e.target.value })
                }
                className={styles.input}
              />
              <div className={styles.domainsSection}>
                <label className={styles.label}>Allowed Email Domains</label>
                {newUniversity.allowedEmailDomains.map((domain, index) => (
                  <div key={index} className={styles.domainInput}>
                    <input
                      type="text"
                      placeholder="@example.edu"
                      value={domain}
                      onChange={(e) => handleDomainChange(index, e.target.value)}
                      className={styles.input}
                    />
                    {newUniversity.allowedEmailDomains.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(index)}
                        className={styles.removeButton}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddDomain}
                  className={styles.addDomainButton}
                >
                  + Add Domain
                </button>
                <p className={styles.infoText}>
                  Email domains must start with @ (e.g., @miuegypt.edu.eg)
                </p>
              </div>
              <button onClick={handleAddUniversity} className={styles.submitButton}>
                Create University
              </button>
            </div>
          )}

          {/* Universities List */}
          <div className={styles.restaurantsList}>
            {displayedUniversities.length === 0 ? (
              <p className={styles.infoText}>No universities found.</p>
            ) : (
              displayedUniversities.map((university) => (
                <div key={university.id} className={styles.restaurantCard}>
                  {editingUniversityId === university.id ? (
                    <div className={styles.addForm}>
                      <h3 className={styles.formTitle}>Edit University</h3>
                      <input
                        type="text"
                        placeholder="University name"
                        value={editUniversity.name || ''}
                        onChange={(e) =>
                          setEditUniversity({ ...editUniversity, name: e.target.value })
                        }
                        className={styles.input}
                      />
                      <div className={styles.domainsSection}>
                        <label className={styles.label}>Allowed Email Domains</label>
                        {(editUniversity.allowedEmailDomains || []).map((domain, index) => (
                          <div key={index} className={styles.domainInput}>
                            <input
                              type="text"
                              placeholder="@example.edu"
                              value={domain}
                              onChange={(e) => {
                                const newDomains = [...(editUniversity.allowedEmailDomains || [])]
                                newDomains[index] = e.target.value
                                setEditUniversity({
                                  ...editUniversity,
                                  allowedEmailDomains: newDomains,
                                })
                              }}
                              className={styles.input}
                            />
                            {(editUniversity.allowedEmailDomains || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newDomains = (editUniversity.allowedEmailDomains || []).filter(
                                    (_, i) => i !== index,
                                  )
                                  setEditUniversity({
                                    ...editUniversity,
                                    allowedEmailDomains: newDomains.length > 0 ? newDomains : [''],
                                  })
                                }}
                                className={styles.removeButton}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setEditUniversity({
                              ...editUniversity,
                              allowedEmailDomains: [
                                ...(editUniversity.allowedEmailDomains || []),
                                '',
                              ],
                            })
                          }}
                          className={styles.addDomainButton}
                        >
                          + Add Domain
                        </button>
                      </div>
                      <div className={styles.formActions}>
                        <button
                          onClick={() => handleUpdateUniversity(university.id)}
                          className={styles.submitButton}
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className={styles.cancelButton}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.restaurantInfo}>
                        <div className={styles.restaurantHeader}>
                          <h3 className={styles.restaurantName}>{university.name}</h3>
                          <span
                            className={`${styles.statusBadge} ${university.isActive ? styles.active : styles.inactive
                              }`}
                          >
                            {university.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className={styles.universityDetails}>
                          <p className={styles.detailItem}>
                            <strong>Email Domains:</strong>{' '}
                            {university.allowedEmailDomains.join(', ')}
                          </p>
                          <p className={styles.detailItem}>
                            <strong>Restaurants:</strong> {university.restaurantCount || 0}
                          </p>
                          <p className={styles.detailItem}>
                            <strong>Users (Students):</strong> {university.userCount || 0}
                          </p>
                          <p className={styles.detailItem}>
                            <strong>Created:</strong>{' '}
                            {new Date(university.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={styles.restaurantActions}>
                        <button
                          onClick={() => handleEditUniversity(university)}
                          className={styles.toggleButton}
                          style={{ background: '#667eea', marginRight: '8px' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(university.id, university.isActive)}
                          className={`${styles.toggleButton} ${university.isActive ? styles.disableButton : styles.enableButton
                            }`}
                        >
                          {university.isActive ? 'Disable' : 'Enable'}
                        </button>
                        {university.restaurantCount! > 0 && (
                          <button
                            onClick={() => {
                              setSelectedUniversityId(university.id)
                              setActiveSection('restaurants')
                            }}
                            className={styles.toggleButton}
                            style={{ background: '#48bb78', marginLeft: '8px' }}
                          >
                            View Restaurants
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

              </>
            )}

            {activeSection === 'restaurants' && (
              <>
        {/* University Selector */}
        <div className={styles.restaurantSelector}>
          <label className={styles.selectorLabel}>View:</label>
          <select
            value={selectedUniversityId}
            onChange={(e) => setSelectedUniversityId(e.target.value)}
            className={styles.selectorDropdown}
          >
            <option value="all">All Universities</option>
            {universities.map((university) => (
              <option key={university.id} value={university.id}>
                {university.name}
              </option>
            ))}
          </select>
          {selectedUniversityId !== 'all' && selectedUniversity && (
            <p className={styles.selectedRestaurantNote}>
              Viewing: {selectedUniversity.name}
            </p>
          )}
        </div>

        {/* Restaurant Management (shown when university is selected) */}
        {selectedUniversityId !== 'all' && selectedUniversity ? (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Restaurants - {selectedUniversity.name}
              </h2>
              <button
                onClick={() => {
                  setShowRestaurantForm(!showRestaurantForm)
                  setError('')
                  setSuccess('')
                  if (!showRestaurantForm) {
                    setNewRestaurant({
                      ...newRestaurant,
                      universityId: selectedUniversityId,
                    })
                  }
                }}
                className={styles.addButton}
              >
                {showRestaurantForm ? 'Cancel' : '+ Add Restaurant'}
              </button>
            </div>

            {showRestaurantForm && (
              <div className={styles.addForm}>
                <h3 className={styles.formTitle}>Create Restaurant & Admin</h3>
                <input
                  type="text"
                  placeholder="Restaurant name"
                  value={newRestaurant.name}
                  onChange={(e) =>
                    setNewRestaurant({ ...newRestaurant, name: e.target.value })
                  }
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Responsible person name"
                  value={newRestaurant.responsibleName}
                  onChange={(e) =>
                    setNewRestaurant({ ...newRestaurant, responsibleName: e.target.value })
                  }
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Responsible phone number"
                  value={newRestaurant.responsiblePhone}
                  onChange={(e) =>
                    setNewRestaurant({ ...newRestaurant, responsiblePhone: e.target.value })
                  }
                  className={styles.input}
                />
                <div className={styles.credentialsSection}>
                  <h4>Restaurant Admin Credentials</h4>
                  <input
                    type="email"
                    placeholder="Admin email (any domain allowed)"
                    value={newRestaurant.adminEmail}
                    onChange={(e) =>
                      setNewRestaurant({ ...newRestaurant, adminEmail: e.target.value })
                    }
                    className={styles.input}
                  />
                  <input
                    type="password"
                    placeholder="Admin password (min 8 characters)"
                    value={newRestaurant.adminPassword}
                    onChange={(e) =>
                      setNewRestaurant({ ...newRestaurant, adminPassword: e.target.value })
                    }
                    className={styles.input}
                  />
                  <p className={styles.infoText}>
                    Restaurant admin email can be any domain. University selection during login
                    will be validated.
                  </p>
                </div>
                <button onClick={handleAddRestaurant} className={styles.submitButton}>
                  Create Restaurant & Admin
                </button>
              </div>
            )}

            {/* Restaurants List */}
            {loadingRestaurants ? (
              <p className={styles.infoText}>Loading restaurants...</p>
            ) : restaurants.length === 0 ? (
              <p className={styles.infoText}>No restaurants found for this university.</p>
            ) : (
              <div className={styles.restaurantsList}>
                {restaurants.map((restaurant) => (
                  <div key={restaurant.id} className={styles.restaurantCard}>
                    <div className={styles.restaurantInfo}>
                      <h3 className={styles.restaurantName}>{restaurant.name}</h3>
                      <div className={styles.universityDetails}>
                        <p className={styles.detailItem}>
                          <strong>Responsible:</strong> {restaurant.responsibleName}
                        </p>
                        <p className={styles.detailItem}>
                          <strong>Phone:</strong> {restaurant.responsiblePhone}
                        </p>
                        <p className={styles.detailItem}>
                          <strong>Users:</strong> {restaurant._count?.users || 0}
                        </p>
                      </div>
                    </div>
                    <div className={styles.restaurantActions}>
                      <button
                        onClick={() => {
                          setActiveSection('orders')
                          router.push(`/admin/dashboard?section=orders&restaurantId=${restaurant.id}`)
                        }}
                        className={styles.toggleButton}
                        style={{ background: '#48bb78' }}
                      >
                        View Monthly Orders
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Restaurants</h2>
            <p className={styles.infoText}>
              Select a university from the dropdown to manage its restaurants.
            </p>
          </div>
        )}
              </>
            )}

            {activeSection === 'orders' && (
              loadingAllRestaurants ? (
                <div className={styles.section}>
                  <p className={styles.infoText}>Loading restaurants...</p>
                </div>
              ) : (
                <AdminMonthlyOrdersPanel
                  restaurants={allRestaurants}
                  initialRestaurantId={selectedOrdersRestaurantId}
                />
              )
            )}

            {activeSection === 'serviceFee' && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Service Fee Accounting</h2>
                {loadingServiceFeeAnalytics ? (
                  <p className={styles.infoText}>Loading service fee analytics...</p>
                ) : serviceFeeAnalytics && !serviceFeeAnalytics.serviceFeeEnabled ? (
                  <div className={styles.serviceFeeInfoBanner}>
                    Service fee is currently disabled. No platform revenue is being collected.
                  </div>
                ) : !serviceFeeAnalytics ? (
                  <p className={styles.infoText}>Unable to load service fee analytics right now.</p>
                ) : serviceFeeAnalytics.restaurants.length === 0 ? (
                  <p className={styles.infoText}>No restaurants found for service fee accounting.</p>
                ) : (
                  <div className={styles.serviceFeeCards}>
                    {serviceFeeAnalytics.restaurants.map((restaurant) => (
                      <div key={restaurant.restaurantId} className={styles.serviceFeeCard}>
                        <h3 className={styles.restaurantName}>{restaurant.restaurantName}</h3>
                        <div className={styles.serviceFeeMetricsGrid}>
                          <div className={styles.analyticsMetricCard}>
                            <span className={styles.metricLabel}>Lifetime Fees</span>
                            <strong className={styles.metricValue}>
                              {formatCurrency(restaurant.totalServiceFeeLifetime)}
                            </strong>
                          </div>
                          <div className={styles.analyticsMetricCard}>
                            <span className={styles.metricLabel}>Current Month Fees</span>
                            <strong className={styles.metricValue}>
                              {formatCurrency(restaurant.totalServiceFeeCurrentMonth)}
                            </strong>
                          </div>
                          <div className={styles.analyticsMetricCard}>
                            <span className={styles.metricLabel}>CARD Fees</span>
                            <strong className={styles.metricValue}>
                              {formatCurrency(restaurant.totalCardFees)}
                            </strong>
                          </div>
                          <div className={styles.analyticsMetricCard}>
                            <span className={styles.metricLabel}>Orders Count</span>
                            <strong className={styles.metricValue}>
                              {restaurant.contributingOrdersCount}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'reports' && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Escalated Reports</h2>
                {loadingGovernance ? (
                  <p className={styles.infoText}>Loading governance alerts...</p>
                ) : escalatedReports.length === 0 ? (
                  <p className={styles.infoText}>No escalated reports right now.</p>
                ) : (
                  <div className={styles.restaurantsList}>
                    {escalatedReports.map((report) => (
                      <article key={report.id} className={styles.restaurantCard}>
                        <div className={styles.restaurantInfo}>
                          <div className={styles.restaurantHeader}>
                            <h3 className={styles.restaurantName}>{report.restaurant.name}</h3>
                            <span className={`${styles.statusBadge} ${styles.disabled}`}>Escalated</span>
                          </div>
                          <p className={styles.detailItem}>
                            <strong>Type:</strong> {report.type}
                          </p>
                          <p className={styles.detailItem}>
                            <strong>Student:</strong> {report.student.name || report.student.email}
                          </p>
                          {report.order?.orderNumber ? (
                            <p className={styles.detailItem}>
                              <strong>Order:</strong> #{report.order.orderNumber}
                            </p>
                          ) : null}
                          {report.comment ? (
                            <p className={styles.detailItem}>
                              <strong>Comment:</strong> {report.comment}
                            </p>
                          ) : null}
                          <p className={styles.detailItem}>
                            <strong>Escalated At:</strong> {new Date(report.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <h2 className={styles.sectionTitle} style={{ marginTop: '28px' }}>
                  Auto Disabled Restaurants
                </h2>
                {loadingGovernance ? (
                  <p className={styles.infoText}>Loading auto-disable alerts...</p>
                ) : autoDisabledRestaurants.length === 0 ? (
                  <p className={styles.infoText}>No auto-disabled restaurants right now.</p>
                ) : (
                  <div className={styles.restaurantsList}>
                    {autoDisabledRestaurants.map((restaurant) => (
                      <article key={restaurant.id} className={styles.restaurantCard}>
                        <div className={styles.restaurantInfo}>
                          <div className={styles.restaurantHeader}>
                            <h3 className={styles.restaurantName}>{restaurant.name}</h3>
                            <span className={`${styles.statusBadge} ${styles.disabled}`}>Auto Disabled</span>
                          </div>
                          <p className={styles.detailItem}>
                            <strong>University:</strong> {restaurant.university.name}
                          </p>
                          <p className={styles.detailItem}>
                            <strong>Trigger Type:</strong> {restaurant.reasonType}
                          </p>
                          <p className={styles.detailItem}>
                            <strong>Unique Students:</strong> {restaurant.uniqueStudents}
                          </p>
                          <p className={styles.detailItem}>{restaurant.reasonMessage}</p>
                          <p className={styles.detailItem}>
                            <strong>Disabled At:</strong> {new Date(restaurant.disabledAt).toLocaleString()}
                          </p>
                        </div>
                        <div className={styles.restaurantActions}>
                          <button
                            type="button"
                            className={`${styles.toggleButton} ${styles.enableButton}`}
                            disabled={reEnablingRestaurantId === restaurant.id}
                            onClick={() => void handleReEnableRestaurant(restaurant.id)}
                          >
                            {reEnablingRestaurantId === restaurant.id
                              ? 'Re-enabling...'
                              : 'Re-enable Restaurant'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
