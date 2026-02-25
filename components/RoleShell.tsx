'use client'

import type { ReactNode } from 'react'
import type { AuthUser } from '@/lib/auth'
import RoleSidebar from './RoleSidebar'
import styles from './role-shell.module.css'

interface RoleShellProps {
  user: AuthUser
  children: ReactNode
}

export default function RoleShell({ user, children }: RoleShellProps) {
  return (
    <div className={styles.shell}>
      <RoleSidebar user={user} />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
