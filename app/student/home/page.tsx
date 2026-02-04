'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { mockRestaurants, Restaurant } from '@/lib/mockData'
import { checkAuth, hasRole } from '@/lib/auth'
import styles from './home.module.css'

export default function StudentHome() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Cookie-based authentication check - single source of truth
    const verifyAuth = async () => {
      const user = await checkAuth()
      
      if (!user || !hasRole(user, 'STUDENT')) {
        router.push('/auth/login')
        return
      }

      // User is authenticated and has correct role - load dashboard data
      // Filter out disabled restaurants, but show coming soon ones
      const enabledRestaurants = mockRestaurants.filter(
        (r) => r.enabled !== false
      )
      setRestaurants(enabledRestaurants)
    }

    verifyAuth()
  }, [router])

  const handleRestaurantClick = (restaurantId: string, isOpen: boolean, comingSoon?: boolean) => {
    if (!isOpen || comingSoon) return
    router.push(`/student/restaurant/${restaurantId}`)
  }

  const handleLogout = async () => {
    if (typeof window === 'undefined') return
    
    try {
      // Call backend logout to clear cookie
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    // Clear non-auth sessionStorage (keep selectedUniversity if needed)
    const selectedUniversity = sessionStorage.getItem('selectedUniversity')
    sessionStorage.clear()
    if (selectedUniversity) {
      sessionStorage.setItem('selectedUniversity', selectedUniversity)
    }
    
    router.push('/')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>UniBite</h1>
        <p className={styles.subtitle}>Taste the campus vibe</p>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div className={styles.restaurantList}>
        {restaurants.map((restaurant) => {
          const isComingSoon = restaurant.comingSoon || false
          const isClickable = restaurant.isOpen && !isComingSoon
          
          return (
            <div
              key={restaurant.id}
              className={`${styles.restaurantCard} ${
                !isClickable ? styles.closed : ''
              } ${isComingSoon ? styles.comingSoon : ''}`}
              onClick={() => handleRestaurantClick(restaurant.id, restaurant.isOpen, isComingSoon)}
            >
              <div className={styles.restaurantInfo}>
                <h2 className={styles.restaurantName}>{restaurant.name}</h2>
                {isComingSoon ? (
                  <span className={styles.comingSoonBadge}>Coming Soon</span>
                ) : restaurant.isOpen ? (
                  <span className={styles.statusOpen}>Open</span>
                ) : (
                  <div className={styles.statusClosed}>
                    <span>Closed</span>
                    {restaurant.opensAt && (
                      <span className={styles.opensAt}>
                        Opens at {restaurant.opensAt}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
