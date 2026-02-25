'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser } from '@/lib/auth'
import { resolveAuthorizedUser, resolveInitialLanguage } from '@/lib/authGuard'
import { APP_ROUTE } from '@/lib/redirectByRole'
import { LanguageProvider } from '@/components/LanguageProvider'
import RoleShell from '@/components/RoleShell'

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const verifyAuth = async () => {
      const authUser = await resolveAuthorizedUser('RESTAURANT_ADMIN')
      if (!authUser) {
        router.push(APP_ROUTE.LOGIN)
        return
      }

      setUser(authUser)
      setLoading(false)
    }

    void verifyAuth()
  }, [router])

  if (loading) {
    return <div style={{ padding: '24px' }} aria-hidden="true" />
  }

  if (!user) {
    return null
  }

  return (
    <LanguageProvider initialLanguage={resolveInitialLanguage(user)}>
      <RoleShell user={user}>{children}</RoleShell>
    </LanguageProvider>
  )
}
