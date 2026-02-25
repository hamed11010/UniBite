'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser } from '@/lib/auth'
import { resolveAuthorizedUser, resolveInitialLanguage, type RequiredRole } from '@/lib/authGuard'
import { APP_ROUTE } from '@/lib/redirectByRole'
import { LanguageProvider } from './LanguageProvider'
import RoleShell from './RoleShell'

interface ProtectedRolePageProps {
  requiredRole?: RequiredRole
  children: (user: AuthUser) => ReactNode
}

export default function ProtectedRolePage({ children, requiredRole }: ProtectedRolePageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const verifyAuth = async () => {
      const authUser = await resolveAuthorizedUser(requiredRole)
      if (!authUser) {
        router.push(APP_ROUTE.LOGIN)
        return
      }

      setUser(authUser)
      setLoading(false)
    }

    void verifyAuth()
  }, [requiredRole, router])

  if (loading) {
    return <div style={{ padding: '24px' }} aria-hidden="true" />
  }

  if (!user) {
    return null
  }

  return (
    <LanguageProvider initialLanguage={resolveInitialLanguage(user)}>
      <RoleShell user={user}>{children(user)}</RoleShell>
    </LanguageProvider>
  )
}
