// Cookie-based authentication utility
// Single source of truth for auth state from backend

import { getCurrentUser } from './api'

export interface AuthUser {
  id: string
  email: string
  role: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STUDENT'
  universityId?: string
  isVerified: boolean
}

/**
 * Check authentication and get current user from backend
 * Uses httpOnly cookies - no sessionStorage needed
 */
export async function checkAuth(): Promise<AuthUser | null> {
  try {
    const user = await getCurrentUser()
    return {
      id: user.id,
      email: user.email,
      role: user.role.toUpperCase() as 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STUDENT',
      universityId: user.universityId,
      isVerified: user.isVerified,
    }
  } catch (error) {
    return null
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, requiredRole: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STUDENT'): boolean {
  if (!user) return false
  return user.role === requiredRole
}
