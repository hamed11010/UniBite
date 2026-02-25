'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { fetchGlobalConfig } from '@/lib/api'
import { checkAuth, hasRole, type AuthUser } from '@/lib/auth'
import { LanguageProvider, useLanguage } from '@/components/LanguageProvider'
import RoleShell from '@/components/RoleShell'
import { translate } from '@/lib/i18n'
import styles from './layout.module.css'

type StudentOrderStatus =
  | 'RECEIVED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED_TO_STUDENT'
  | 'COMPLETED'
  | 'CANCELLED'

type StudentOrderSignal = {
  id: string
  status: StudentOrderStatus
  paymentMethod: 'CARD'
  createdAt: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'
const ACTIVE_ORDER_STATUSES: StudentOrderStatus[] = [
  'RECEIVED',
  'PREPARING',
  'READY',
  'DELIVERED_TO_STUDENT',
]

function byMostRecent(orders: StudentOrderSignal[]) {
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

function StudentLayoutContent({
  children,
  user,
  isMaintenancePage,
  activeOrderId,
}: {
  children: React.ReactNode
  user: AuthUser
  isMaintenancePage: boolean
  activeOrderId: string | null
}) {
  const router = useRouter()
  const { messages } = useLanguage()

  return (
    <RoleShell user={user}>
      <>
        {!isMaintenancePage && (
          <div
            className={styles.quickActionsBar}
          >
            <button
              type="button"
              className={styles.quickActionButton}
              onClick={() => router.push('/student/orders')}
            >
              {translate(messages, 'student.layout.myOrders', 'My Orders')}
            </button>
            {activeOrderId && (
              <button
                type="button"
                className={`${styles.quickActionButton} ${styles.quickActionActive}`}
                onClick={() => router.push(`/student/order/${activeOrderId}`)}
              >
                {translate(messages, 'student.layout.myActiveOrder', 'My Active Order')}
              </button>
            )}
          </div>
        )}

        {children}
      </>
    </RoleShell>
  )
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isStudentSession, setIsStudentSession] = useState(false)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)

  const fetchOrderSignals = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/order/student`, {
        credentials: 'include',
      })

      if (!res.ok) {
        setActiveOrderId(null)
        return
      }

      const orders = (await res.json()) as StudentOrderSignal[]
      const recentOrders = byMostRecent(Array.isArray(orders) ? orders : [])

      const activeOrder = recentOrders.find((order) =>
        ACTIVE_ORDER_STATUSES.includes(order.status),
      )

      setActiveOrderId(activeOrder?.id ?? null)
    } catch (error) {
      console.error('Failed to load student order signals', error)
      setActiveOrderId(null)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initLayout = async () => {
      try {
        const user = await checkAuth()

        if (!user || !hasRole(user, 'STUDENT')) {
          router.push('/auth/login')
          return
        }

        setCurrentUser(user)
        setIsStudentSession(true)

        const config = await fetchGlobalConfig()
        if (config.maintenanceMode) {
          if (pathname !== '/maintenance') {
            router.push('/maintenance')
            return
          }
        } else if (pathname === '/maintenance') {
          router.push('/student/home')
          return
        }

        if (pathname !== '/maintenance') {
          await fetchOrderSignals()
        }
      } catch (error) {
        console.error('Failed to initialize student layout', error)
      } finally {
        setLoading(false)
      }
    }

    void initLayout()
  }, [pathname, router, fetchOrderSignals])

  useEffect(() => {
    if (!isStudentSession || pathname === '/maintenance' || typeof window === 'undefined') return

    const interval = window.setInterval(() => {
      void fetchOrderSignals()
    }, 15000)

    const handleFocus = () => {
      void fetchOrderSignals()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchOrderSignals()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isStudentSession, pathname, fetchOrderSignals])

  if (loading) {
    return <div className={styles.loading} aria-hidden="true" />
  }

  if (!currentUser) {
    return null
  }

  const isMaintenancePage = pathname === '/maintenance'

  return (
    <LanguageProvider initialLanguage={currentUser.language}>
      <StudentLayoutContent
        user={currentUser}
        isMaintenancePage={isMaintenancePage}
        activeOrderId={activeOrderId}
      >
        {children}
      </StudentLayoutContent>
    </LanguageProvider>
  )
}
