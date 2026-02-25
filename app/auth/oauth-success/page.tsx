'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/api'
import { APP_ROUTE, redirectByRole } from '@/lib/redirectByRole'

export default function OAuthSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const resolveOAuthSession = async () => {
      try {
        const user = await getCurrentUser()
        router.replace(redirectByRole(user.role.toUpperCase()))
      } catch {
        router.replace(APP_ROUTE.LOGIN)
      }
    }

    void resolveOAuthSession()
  }, [router])

  return <div style={{ padding: '24px' }}>Signing you in...</div>
}
