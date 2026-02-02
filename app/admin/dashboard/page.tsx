'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { mockRestaurants, Restaurant } from '@/lib/mockData'
import styles from './admin.module.css'

export default function PlatformAdminDashboard() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    university: 'MIU',
    opensAt: '08:00',
    closesAt: '22:00',
    status: 'active' as 'active' | 'comingSoon',
    email: '',
    password: '',
    responsibleName: '',
    responsiblePhone: '',
  })
  const [createdCredentials, setCreatedCredentials] = useState<{
    restaurantName: string
    email: string
    password: string
    responsibleName: string
    responsiblePhone: string
  } | null>(null)

  // Mock statistics - in production, these would come from API
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    ordersToday: 87,
    topRestaurant: 'Campus Cafe',
  })
  const [reportSummary, setReportSummary] = useState<
    { restaurantId: string; restaurantName: string; count: number; topReason: string }[]
  >([])

  useEffect(() => {
    // Update stats when restaurants or selected restaurant changes
    if (selectedRestaurantId === 'all') {
      setStats({
        totalRestaurants: restaurants.length,
        ordersToday: 87, // Mock value
        topRestaurant: restaurants.length > 0 ? restaurants[0].name : 'N/A',
      })
    } else {
      const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId)
      setStats({
        totalRestaurants: 1,
        ordersToday: selectedRestaurant ? 23 : 0, // Mock value for selected restaurant
        topRestaurant: selectedRestaurant?.name || 'N/A',
      })
    }
  }, [restaurants, selectedRestaurantId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = sessionStorage.getItem('isAuthenticated')
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      
      if (!isAuthenticated || user.role !== 'super_admin') {
        router.push('/auth/login')
        return
      }

      setRestaurants(mockRestaurants)

      // Load report overview (demo mode)
      const allReports = JSON.parse(sessionStorage.getItem('reports') || '[]')
      const grouped: Record<string, { restaurantId: string; restaurantName: string; count: number; reasons: Record<string, number> }> = {}
      allReports.forEach((r: any) => {
        if (!grouped[r.restaurantId]) {
          grouped[r.restaurantId] = {
            restaurantId: r.restaurantId,
            restaurantName: r.restaurantName,
            count: 0,
            reasons: {},
          }
        }
        grouped[r.restaurantId].count += 1
        grouped[r.restaurantId].reasons[r.reason] = (grouped[r.restaurantId].reasons[r.reason] || 0) + 1
      })
      const summary = Object.values(grouped).map((g) => {
        const topReason =
          Object.entries(g.reasons).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
        return {
          restaurantId: g.restaurantId,
          restaurantName: g.restaurantName,
          count: g.count,
          topReason,
        }
      })
      setReportSummary(summary)
    }
  }, [router])

  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false)

  const handleAddRestaurant = () => {
    if (
      !newRestaurant.name.trim() ||
      !newRestaurant.university.trim() ||
      !newRestaurant.email.trim() ||
      !newRestaurant.password.trim() ||
      !newRestaurant.responsibleName.trim() ||
      !newRestaurant.responsiblePhone.trim()
    ) {
      alert('Please fill in all required fields')
      return
    }
    if (!responsibilityAccepted) {
      alert('You must confirm responsibility for fulfilling orders.')
      return
    }

    const restaurant: Restaurant = {
      id: `rest${Date.now()}`,
      name: newRestaurant.name,
      isOpen: false,
      opensAt: newRestaurant.opensAt,
      closesAt: newRestaurant.closesAt,
      comingSoon: newRestaurant.status === 'comingSoon',
      enabled: true,
    }

    setRestaurants([...restaurants, restaurant])
    
    // Store credentials to display
    setCreatedCredentials({
      restaurantName: newRestaurant.name,
      email: newRestaurant.email,
      password: newRestaurant.password,
      responsibleName: newRestaurant.responsibleName,
      responsiblePhone: newRestaurant.responsiblePhone,
    })
    
    setNewRestaurant({
      name: '',
      university: 'MIU',
      opensAt: '08:00',
      closesAt: '22:00',
      status: 'active',
      email: '',
      password: '',
      responsibleName: '',
      responsiblePhone: '',
    })
    setResponsibilityAccepted(false)
    setShowAddForm(false)
  }

  const handleRemoveRestaurant = (id: string) => {
    if (confirm('Are you sure you want to remove this restaurant?')) {
      setRestaurants(restaurants.filter((r) => r.id !== id))
    }
  }

  const toggleRestaurantStatus = (id: string) => {
    setRestaurants(
      restaurants.map((r) =>
        r.id === id ? { ...r, isOpen: !r.isOpen } : r
      )
    )
  }

  const toggleComingSoon = (id: string) => {
    setRestaurants(
      restaurants.map((r) =>
        r.id === id ? { ...r, comingSoon: !r.comingSoon } : r
      )
    )
  }

  const toggleEnabled = (id: string) => {
    setRestaurants(
      restaurants.map((r) =>
        r.id === id ? { ...r, enabled: r.enabled === false ? true : false } : r
      )
    )
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
      router.push('/')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Platform Admin Dashboard</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div className={styles.content}>
        {/* Restaurant Selector */}
        <div className={styles.restaurantSelector}>
          <label className={styles.selectorLabel}>View Stats For:</label>
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className={styles.selectorDropdown}
          >
            <option value="all">All Restaurants</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
          {selectedRestaurantId !== 'all' && (
            <p className={styles.selectedRestaurantNote}>
              Stats for: {restaurants.find(r => r.id === selectedRestaurantId)?.name || 'N/A'}
            </p>
          )}
        </div>

        {/* Basic Analytics */}
        <div className={styles.overviewSection}>
          <h2 className={styles.sectionTitle}>Basic Analytics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalRestaurants}</div>
              <div className={styles.statLabel}>Total Restaurants</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.ordersToday}</div>
              <div className={styles.statLabel}>Orders Today</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.topRestaurant}</div>
              <div className={styles.statLabel}>Restaurant with Most Orders Today</div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Reports Overview</h2>
          <p className={styles.infoText}>
            In production, restaurants may be auto-disabled based on reports and inactivity, with manual review at scale. This is a demo-only overview.
          </p>
          {reportSummary.length === 0 ? (
            <p className={styles.infoText}>No reports submitted yet.</p>
          ) : (
            <div className={styles.restaurantsList}>
              {reportSummary.map((r) => (
                <div key={r.restaurantId} className={styles.restaurantCard}>
                  <div className={styles.restaurantInfo}>
                    <h3 className={styles.restaurantName}>{r.restaurantName}</h3>
                    <p className={styles.restaurantHours}>
                      Reports: {r.count}
                    </p>
                    <p className={styles.restaurantHours}>
                      Most common reason: {r.topReason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Restaurant Management</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={styles.addButton}
            >
              {showAddForm ? 'Cancel' : '+ Add Restaurant'}
            </button>
          </div>

          {showAddForm && (
            <div className={styles.addForm}>
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
                placeholder="University (e.g., MIU)"
                value={newRestaurant.university}
                onChange={(e) =>
                  setNewRestaurant({ ...newRestaurant, university: e.target.value })
                }
                className={styles.input}
              />
              <div className={styles.timeInputs}>
                <input
                  type="time"
                  value={newRestaurant.opensAt}
                  onChange={(e) =>
                    setNewRestaurant({
                      ...newRestaurant,
                      opensAt: e.target.value,
                    })
                  }
                  className={styles.input}
                />
                <input
                  type="time"
                  value={newRestaurant.closesAt}
                  onChange={(e) =>
                    setNewRestaurant({
                      ...newRestaurant,
                      closesAt: e.target.value,
                    })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.statusSelect}>
                <label>Restaurant Status</label>
                <select
                  value={newRestaurant.status}
                  onChange={(e) =>
                    setNewRestaurant({
                      ...newRestaurant,
                      status: e.target.value as 'active' | 'comingSoon',
                    })
                  }
                  className={styles.input}
                >
                  <option value="active">Active</option>
                  <option value="comingSoon">Coming Soon</option>
                </select>
              </div>
              <div className={styles.credentialsSection}>
                <h4>Restaurant Admin Credentials</h4>
                <input
                  type="email"
                  placeholder="Login email"
                  value={newRestaurant.email}
                  onChange={(e) =>
                    setNewRestaurant({ ...newRestaurant, email: e.target.value })
                  }
                  className={styles.input}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newRestaurant.password}
                  onChange={(e) =>
                    setNewRestaurant({ ...newRestaurant, password: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.credentialsSection}>
                <h4>Restaurant Responsible Person</h4>
                <input
                  type="text"
                  placeholder="Full name"
                  value={newRestaurant.responsibleName}
                  onChange={(e) =>
                    setNewRestaurant({ ...newRestaurant, responsibleName: e.target.value })
                  }
                  className={styles.input}
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={newRestaurant.responsiblePhone}
                  onChange={(e) =>
                    setNewRestaurant({ ...newRestaurant, responsiblePhone: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.credentialsSection}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={responsibilityAccepted}
                    onChange={(e) => setResponsibilityAccepted(e.target.checked)}
                  />
                  <span>
                    I confirm that I am responsible for fulfilling orders received through UniBite.
                  </span>
                </label>
                <p className={styles.infoText}>
                  UniBite does not collect personal IDs. Responsibility is enforced through platform rules. (demo mode)
                </p>
              </div>
              <div className={styles.formActions}>
                <button onClick={handleAddRestaurant} className={styles.saveButton}>
                  Create Restaurant
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewRestaurant({ name: '', opensAt: '08:00', closesAt: '22:00', status: 'active', email: '', password: '', responsibleName: '', responsiblePhone: '' })
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {createdCredentials && (
            <div className={styles.credentialsDisplay}>
              <h3>Restaurant Created Successfully!</h3>
              <p>Share these credentials with the restaurant owner:</p>
              <div className={styles.credentialsBox}>
                <div className={styles.credentialItem}>
                  <strong>Restaurant Name:</strong> {createdCredentials.restaurantName}
                </div>
                <div className={styles.credentialItem}>
                  <strong>Admin Email:</strong> {createdCredentials.email}
                </div>
                <div className={styles.credentialItem}>
                  <strong>Password:</strong> {createdCredentials.password}
                </div>
                <div className={styles.credentialItem}>
                  <strong>Responsible Person:</strong> {createdCredentials.responsibleName}
                </div>
                <div className={styles.credentialItem}>
                  <strong>Phone Number:</strong> {createdCredentials.responsiblePhone}
                </div>
              </div>
              <p className={styles.passwordNote}>
                ⚠️ Passwords are visible in demo mode only.
              </p>
              <button
                onClick={() => setCreatedCredentials(null)}
                className={styles.closeButton}
              >
                Close
              </button>
            </div>
          )}

          <div className={styles.restaurantsList}>
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className={styles.restaurantCard}>
                <div className={styles.restaurantInfo}>
                  <h3 className={styles.restaurantName}>{restaurant.name}</h3>
                  <p className={styles.restaurantHours}>
                    {restaurant.opensAt} - {restaurant.closesAt}
                  </p>
                  <div className={styles.statusBadges}>
                    <span
                      className={`${styles.statusBadge} ${
                        restaurant.isOpen ? styles.open : styles.closed
                      }`}
                    >
                      {restaurant.isOpen ? 'Open' : 'Closed'}
                    </span>
                    {restaurant.comingSoon && (
                      <span className={`${styles.statusBadge} ${styles.comingSoon}`}>
                        Coming Soon
                      </span>
                    )}
                    {restaurant.enabled === false && (
                      <span className={`${styles.statusBadge} ${styles.disabled}`}>
                        Disabled
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.restaurantActions}>
                  <button
                    onClick={() => toggleRestaurantStatus(restaurant.id)}
                    className={styles.toggleButton}
                  >
                    {restaurant.isOpen ? 'Force Close' : 'Force Open'}
                  </button>
                  <button
                    onClick={() => toggleComingSoon(restaurant.id)}
                    className={`${styles.toggleButton} ${restaurant.comingSoon ? styles.active : ''}`}
                  >
                    {restaurant.comingSoon ? 'Remove Coming Soon' : 'Mark Coming Soon'}
                  </button>
                  <button
                    onClick={() => toggleEnabled(restaurant.id)}
                    className={`${styles.toggleButton} ${restaurant.enabled === false ? styles.active : ''}`}
                  >
                    {restaurant.enabled === false ? 'Enable' : 'Disable'}
                  </button>
                  <button
                    onClick={() => handleRemoveRestaurant(restaurant.id)}
                    className={styles.removeButton}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Restaurant Admins</h2>
          <p className={styles.infoText}>
            Assign restaurant admins functionality would be implemented here.
            (Admin assignment interface)
          </p>
        </div>
      </div>
    </div>
  )
}
