'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import { checkAuth, hasRole } from '@/lib/auth'
import { resendVerificationCode } from '@/lib/api'
import { translate } from '@/lib/i18n'
import { APP_ROUTE } from '@/lib/redirectByRole'
import styles from './home.module.css'

type Restaurant = {
  id: string
  name: string
  isOpen: boolean
  isBusy?: boolean
  openTime?: string
  closeTime?: string
  comingSoon?: boolean
}

export default function StudentHome() {
  const router = useRouter()
  const { messages } = useLanguage()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [universityId, setUniversityId] = useState<string | null>(null)
  const [greetingName, setGreetingName] = useState<string>(
    translate(messages, 'student.home.greetingFallback', 'there'),
  )
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resendingCode, setResendingCode] = useState(false)

  const loadRestaurants = useCallback(async (targetUniversityId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/restaurant/public/university/${targetUniversityId}`,
        { credentials: 'include' }
      )

      if (!res.ok) {
        throw new Error(
          translate(messages, 'student.home.errorLoadRestaurants', 'Failed to load restaurants'),
        )
      }

      const data = await res.json()
      setRestaurants(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading restaurants:', error)
      setRestaurants([])
    }
  }, [messages])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Cookie-based authentication check - single source of truth
    const verifyAuth = async () => {
      const user = await checkAuth()

      if (!user || !hasRole(user, 'STUDENT')) {
        router.push('/auth/login')
        return
      }

      const fallbackName = user.email.split('@')[0]
      setGreetingName(user.name?.trim() || fallbackName)
      setUnverifiedEmail(user.isVerified ? null : user.email)

      if (!user.universityId) {
        setRestaurants([])
        return
      }

      setUniversityId(user.universityId)
      await loadRestaurants(user.universityId)
    }

    void verifyAuth()
  }, [router, loadRestaurants])

  const handleResendVerificationCode = async () => {
    if (!unverifiedEmail || resendingCode) return

    setResendingCode(true)
    try {
      await resendVerificationCode(unverifiedEmail)
      const Swal = (await import('sweetalert2')).default
      await Swal.fire({
        icon: 'success',
        title: 'Verification code sent',
        text: 'Please check your email for the 6-digit verification code.',
        confirmButtonText: 'OK',
      })
    } catch (error: any) {
      const Swal = (await import('sweetalert2')).default
      await Swal.fire({
        icon: 'error',
        title: 'Could not resend code',
        text:
          error?.message ||
          'Unable to resend verification code right now. Please try again later.',
      })
    } finally {
      setResendingCode(false)
    }
  }

  useEffect(() => {
    if (!universityId || typeof window === 'undefined') return

    const refreshRestaurants = () => {
      void loadRestaurants(universityId)
    }

    const interval = window.setInterval(refreshRestaurants, 15000)
    window.addEventListener('focus', refreshRestaurants)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshRestaurants()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshRestaurants)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [universityId, loadRestaurants])

  const handleRestaurantClick = async (restaurant: Restaurant) => {
    if (!restaurant.isOpen) {
      const Swal = (await import('sweetalert2')).default
      Swal.fire({
        icon: 'warning',
        title: translate(messages, 'student.home.closedTitle', `${restaurant.name} is currently closed`),
        text: restaurant.openTime
          ? translate(messages, 'student.home.closedWithOpenTime', 'It is scheduled to open at {time}.').replace('{time}', restaurant.openTime)
          : translate(messages, 'student.home.closedNoOpenTime', 'Please check back later.'),
        footer: restaurant.closeTime
          ? translate(messages, 'student.home.closedFooter', 'Scheduled closing time: {time}').replace('{time}', restaurant.closeTime)
          : undefined,
        confirmButtonText: translate(messages, 'common.ok', 'OK'),
      })
      return
    }

    if (restaurant.isBusy) {
      const Swal = (await import('sweetalert2')).default
      Swal.fire({
        icon: 'info',
        title: translate(messages, 'student.home.busyTitle', `${restaurant.name} is temporarily busy`),
        text: translate(
          messages,
          'student.home.busyText',
          'This restaurant has reached its active order capacity. Please try again shortly.',
        ),
        confirmButtonText: translate(messages, 'student.home.understood', 'Understood'),
      })
      return
    }

    router.push(`/student/restaurant/${restaurant.id}`)
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

    router.push(APP_ROUTE.ROOT)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>UniBite</h1>
        <p className={styles.greeting}>
          {translate(messages, 'student.home.hello', 'Hello')}, {greetingName}
        </p>
        <p className={styles.subtitle}>
          {translate(messages, 'student.home.subtitle', 'Taste the campus vibe')}
        </p>
        <button onClick={handleLogout} className={styles.logoutButton}>
          {translate(messages, 'sidebar.logout', 'Logout')}
        </button>
      </div>

      {unverifiedEmail && (
        <div className={styles.verificationBanner}>
          <p className={styles.verificationText}>
            Please verify your email before placing orders.
          </p>
          <div className={styles.verificationActions}>
            <button
              type="button"
              className={styles.verificationButton}
              onClick={() => router.push(`/auth/verify?email=${encodeURIComponent(unverifiedEmail)}`)}
            >
              Go to Verification Page
            </button>
            <button
              type="button"
              className={styles.verificationButton}
              onClick={() => {
                void handleResendVerificationCode()
              }}
              disabled={resendingCode}
            >
              {resendingCode ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.restaurantList}>
        {restaurants.map((restaurant) => {
          const isComingSoon = restaurant.comingSoon || false
          const isClickable = !isComingSoon

          return (
            <div
              key={restaurant.id}
              className={`${styles.restaurantCard} ${!isClickable ? styles.closed : ''
                } ${isComingSoon ? styles.comingSoon : ''}`}
              onClick={() => handleRestaurantClick(restaurant)}
            >
              <div className={styles.restaurantInfo}>
                <h2 className={styles.restaurantName}>{restaurant.name}</h2>
                {isComingSoon ? (
                  <span className={styles.comingSoonBadge}>
                    {translate(messages, 'student.home.comingSoon', 'Coming Soon')}
                  </span>
                ) : restaurant.isBusy ? (
                  <span className={styles.statusBusy}>
                    {translate(messages, 'student.home.busy', 'Busy')}
                  </span>
                ) : restaurant.isOpen ? (
                  <span className={styles.statusOpen}>
                    {translate(messages, 'student.home.open', 'Open')}
                  </span>
                ) : (
                  <div className={styles.statusClosed}>
                    <span>{translate(messages, 'student.home.closed', 'Closed')}</span>
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
