// Cookie-based authentication utility
// Single source of truth for auth state from backend

import { getCurrentUser } from './api'

export interface AuthUser {
  id: string
  email: string
  role: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STUDENT'
  name?: string | null
  phone?: string | null
  language?: 'en' | 'ar'
  universityId?: string
  isVerified: boolean
  restaurantId?: string
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
      name: user.name,
      phone: user.phone,
      language: user.language,
      universityId: user.universityId,
      isVerified: user.isVerified,
      restaurantId: user.restaurantId,
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

export function getInitialLanguageForUser(
  user: Pick<AuthUser, 'language'>,
): 'en' | 'ar' {
  return user.language === 'ar' ? 'ar' : 'en'
}
