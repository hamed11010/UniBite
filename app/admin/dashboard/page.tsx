'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { checkAuth, hasRole } from '@/lib/auth'
import {
  fetchAllUniversities,
  createUniversity,
  updateUniversity,
  toggleUniversityStatus,
  createRestaurant,
  fetchRestaurantsByUniversity,
  fetchActiveUniversities,
  type University,
  type CreateUniversityDto,
  type UpdateUniversityDto,
  type CreateRestaurantDto,
  type Restaurant,
} from '@/lib/api'
import { logout } from '@/lib/api'
import styles from './admin.module.css'

export default function PlatformAdminDashboard() {
  const router = useRouter()
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
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)

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
    }

    verifyAuth()
  }, [router])

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
  }, [selectedUniversityId, showRestaurantForm])

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

  const loadRestaurants = async (universityId: string) => {
    try {
      setLoadingRestaurants(true)
      const data = await fetchRestaurantsByUniversity(universityId)
      setRestaurants(data)
    } catch (err: any) {
      console.error('Failed to load restaurants:', err)
    } finally {
      setLoadingRestaurants(false)
    }
  }

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
    router.push('/')
  }

  const selectedUniversity = universities.find((u) => u.id === selectedUniversityId)
  const displayedUniversities =
    selectedUniversityId === 'all' ? universities : selectedUniversity ? [selectedUniversity] : []

  // Calculate aggregate stats
  const totalRestaurants = displayedUniversities.reduce((sum, u) => sum + (u.restaurantCount || 0), 0)
  const totalUsers = displayedUniversities.reduce((sum, u) => sum + (u.userCount || 0), 0)
  const activeUniversities = displayedUniversities.filter((u) => u.isActive).length

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

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

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
                            className={`${styles.statusBadge} ${
                              university.isActive ? styles.active : styles.inactive
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
                          className={`${styles.toggleButton} ${
                            university.isActive ? styles.disableButton : styles.enableButton
                          }`}
                        >
                          {university.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Restaurant Management (shown when university is selected) */}
        {selectedUniversityId !== 'all' && selectedUniversity && (
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
                          <strong>Admins:</strong> {restaurant._count?.users || 0}
                        </p>
                        <p className={styles.detailItem}>
                          <strong>Created:</strong>{' '}
                          {new Date(restaurant.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
