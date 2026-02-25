'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchPendingOrdersCount, logout } from '@/lib/api'
import type { AuthUser } from '@/lib/auth'
import { translate } from '@/lib/i18n'
import { APP_ROUTE } from '@/lib/redirectByRole'
import { useLanguage } from './LanguageProvider'
import styles from './role-sidebar.module.css'

type SidebarRole = 'STUDENT' | 'RESTAURANT_ADMIN' | 'SUPER_ADMIN'

type IconName =
  | 'home'
  | 'orders'
  | 'report'
  | 'settings'
  | 'profile'
  | 'password'
  | 'language'
  | 'info'
  | 'logout'
  | 'dashboard'
  | 'menu'
  | 'university'
  | 'restaurant'

type SidebarItem = {
  key: string
  href?: string
  logout?: boolean
  icon: IconName
  showAttentionBadge?: boolean
}

const STUDENT_ITEMS: SidebarItem[] = [
  { key: 'sidebar.home', href: '/student/home', icon: 'home' },
  {
    key: 'sidebar.myOrders',
    href: '/student/orders?tab=active',
    icon: 'orders',
    showAttentionBadge: true,
  },
  { key: 'sidebar.reports', href: '/student/orders?tab=reports', icon: 'report' },
  { key: 'sidebar.settings', href: '/settings', icon: 'settings' },
  { key: 'sidebar.profile', href: '/profile', icon: 'profile' },
  { key: 'sidebar.changePassword', href: '/settings/change-password', icon: 'password' },
  { key: 'sidebar.language', href: '/settings', icon: 'language' },
  { key: 'sidebar.aboutUs', href: '/about', icon: 'info' },
  { key: 'sidebar.logout', logout: true, icon: 'logout' },
]

const RESTAURANT_ADMIN_ITEMS: SidebarItem[] = [
  { key: 'sidebar.dashboard', href: '/restaurant/dashboard?tab=orders', icon: 'dashboard' },
  {
    key: 'sidebar.incomingOrders',
    href: '/restaurant/dashboard?tab=orders&ordersView=incoming',
    icon: 'orders',
    showAttentionBadge: true,
  },
  { key: 'sidebar.todaysOrders', href: '/restaurant/dashboard?tab=orders&ordersView=today', icon: 'orders' },
  { key: 'sidebar.menu', href: '/restaurant/dashboard?tab=menu', icon: 'menu' },
  { key: 'sidebar.reports', href: '/restaurant/dashboard?tab=reports', icon: 'report' },
  { key: 'sidebar.settings', href: '/settings', icon: 'settings' },
  { key: 'sidebar.profile', href: '/profile', icon: 'profile' },
  { key: 'sidebar.changePassword', href: '/settings/change-password', icon: 'password' },
  { key: 'sidebar.language', href: '/settings', icon: 'language' },
  { key: 'sidebar.aboutUs', href: '/about', icon: 'info' },
  { key: 'sidebar.logout', logout: true, icon: 'logout' },
]

const SUPER_ADMIN_ITEMS: SidebarItem[] = [
  { key: 'sidebar.dashboard', href: '/admin/dashboard?section=overview', icon: 'dashboard' },
  { key: 'sidebar.universities', href: '/admin/dashboard?section=universities', icon: 'university' },
  { key: 'sidebar.restaurants', href: '/admin/dashboard?section=restaurants', icon: 'restaurant' },
  { key: 'sidebar.monthlyOrders', href: '/admin/dashboard?section=orders', icon: 'orders' },
  { key: 'sidebar.reports', href: '/admin/dashboard?section=reports', icon: 'report' },
  { key: 'sidebar.settings', href: '/settings', icon: 'settings' },
  { key: 'sidebar.profile', href: '/profile', icon: 'profile' },
  { key: 'sidebar.changePassword', href: '/settings/change-password', icon: 'password' },
  { key: 'sidebar.language', href: '/settings', icon: 'language' },
  { key: 'sidebar.aboutUs', href: '/about', icon: 'info' },
  { key: 'sidebar.logout', logout: true, icon: 'logout' },
]

function getItemsForRole(role: SidebarRole): SidebarItem[] {
  if (role === 'SUPER_ADMIN') return SUPER_ADMIN_ITEMS
  if (role === 'RESTAURANT_ADMIN') return RESTAURANT_ADMIN_ITEMS
  return STUDENT_ITEMS
}

function isSidebarRole(role: string): role is SidebarRole {
  return role === 'STUDENT' || role === 'RESTAURANT_ADMIN' || role === 'SUPER_ADMIN'
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'
const COUNT_REFRESH_MS = 15000

function SidebarIcon({ name }: { name: IconName }) {
  const icons: Record<IconName, string> = {
    home: 'M3 9.5 12 3l9 6.5v9.5a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1V9.5Z',
    orders: 'M5 4h14v16H5z M8 8h8 M8 12h8 M8 16h5',
    report: 'M6 4h12v16H6z M9 9h6 M9 13h6',
    settings: 'M12 8.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6z M4 12h2 M18 12h2 M12 4v2 M12 18v2 M6.3 6.3l1.4 1.4 M16.3 16.3l1.4 1.4 M17.7 6.3l-1.4 1.4 M7.7 16.3l-1.4 1.4',
    profile: 'M12 13.5a4 4 0 1 0-4-4 4 4 0 0 0 4 4z M5 20a7 7 0 0 1 14 0',
    password: 'M6.5 11V8.8a5.5 5.5 0 0 1 11 0V11 M5 11h14v10H5z',
    language: 'M4 6h10 M9 6a16 16 0 0 1-5 12 M9 6a16 16 0 0 0 5 12 M14 10h6 M17 10v9 M14 19h6',
    info: 'M12 7.2a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z M12 11v6',
    logout: 'M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4 M14 9l3 3-3 3 M8 12h9',
    dashboard: 'M4 4h7v7H4z M13 4h7v5h-7z M13 11h7v9h-7z M4 13h7v7H4z',
    menu: 'M5 6h14 M5 11h14 M5 16h14',
    university: 'M3 9.5 12 4l9 5.5 M6 11.5V18 M10 13v5 M14 13v5 M18 11.5V18 M4 20h16',
    restaurant: 'M5 5h14v4H5z M6 9v11 M18 9v11 M8.5 13h5',
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.navIconSvg}>
      <path d={icons[name]} />
    </svg>
  )
}

export default function RoleSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { messages } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)
  const [attentionCount, setAttentionCount] = useState(0)

  const items = useMemo(() => {
    if (!isSidebarRole(user.role)) {
      console.error(`Unsupported sidebar role received: ${user.role}`)
      return []
    }
    return getItemsForRole(user.role)
  }, [user.role])

  const loadAttentionCount = useCallback(async () => {
    try {
      if (user.role === 'STUDENT') {
        const res = await fetch(`${API_BASE_URL}/order/student`, {
          credentials: 'include',
        })

        if (!res.ok) {
          setAttentionCount(0)
          return
        }

        const data: unknown = await res.json()
        if (!Array.isArray(data)) {
          setAttentionCount(0)
          return
        }

        const pendingConfirmations = data.filter(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            'status' in item &&
            (item as { status?: string }).status === 'DELIVERED_TO_STUDENT',
        ).length

        setAttentionCount(pendingConfirmations)
        return
      }

      if (user.role === 'RESTAURANT_ADMIN' && user.restaurantId) {
        const result = await fetchPendingOrdersCount(user.restaurantId)
        setAttentionCount(result.pendingOrders ?? 0)
        return
      }

      setAttentionCount(0)
    } catch (error) {
      console.error('Failed to load sidebar attention count', error)
      setAttentionCount(0)
    }
  }, [user.restaurantId, user.role])

  useEffect(() => {
    void loadAttentionCount()
    const interval = window.setInterval(() => {
      void loadAttentionCount()
    }, COUNT_REFRESH_MS)

    const handleFocus = () => {
      void loadAttentionCount()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadAttentionCount()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [loadAttentionCount])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      router.push(APP_ROUTE.ROOT)
    }
  }

  const isItemActive = (href?: string) => {
    if (!href) return false
    const [hrefPath, hrefQueryString] = href.split('?')
    if (pathname !== hrefPath) return false

    if (!hrefQueryString) {
      return searchParams.toString() === ''
    }

    const expectedQuery = new URLSearchParams(hrefQueryString)
    const currentQuery = new URLSearchParams(searchParams.toString())
    const expectedEntries = Array.from(expectedQuery.entries())

    for (const [key, value] of expectedEntries) {
      if (currentQuery.get(key) !== value) {
        return false
      }
    }

    return true
  }

  const formattedAttentionCount = attentionCount > 99 ? '99+' : String(attentionCount)

  return (
    <aside
      className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed}`}
    >
      <div className={styles.sidebarHeader}>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-label={translate(messages, isExpanded ? 'sidebar.closeMenu' : 'sidebar.openMenu')}
        >
          <span className={styles.toggleIconLines} />
          <span className={styles.toggleIconLines} />
          <span className={styles.toggleIconLines} />
          {attentionCount > 0 && (
            <span className={styles.toggleBadge}>{formattedAttentionCount}</span>
          )}
        </button>
        <div className={styles.brand}>
          <Image
            src="/logo-full.svg"
            alt="UniBite"
            className={styles.brandFull}
            width={150}
            height={84}
            priority
          />
          <Image
            src="/logo-icon.svg"
            alt="UniBite"
            className={styles.brandIcon}
            width={30}
            height={30}
            priority
          />
        </div>
      </div>

      <nav className={styles.nav}>
        {items.map((item) => {
          const itemLabel = translate(messages, item.key)
          const itemBadge = item.showAttentionBadge && attentionCount > 0

          if (item.logout) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => void handleLogout()}
                className={styles.navItem}
                title={itemLabel}
              >
                <span className={styles.navIcon}>
                  <SidebarIcon name={item.icon} />
                </span>
                <span className={styles.navText}>{itemLabel}</span>
                {itemBadge && <span className={styles.itemBadge}>{formattedAttentionCount}</span>}
              </button>
            )
          }

          return (
            <Link
              key={item.key}
              href={item.href || '#'}
              title={itemLabel}
              className={`${styles.navItem} ${isItemActive(item.href) ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>
                <SidebarIcon name={item.icon} />
              </span>
              <span className={styles.navText}>{itemLabel}</span>
              {itemBadge && <span className={styles.itemBadge}>{formattedAttentionCount}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
