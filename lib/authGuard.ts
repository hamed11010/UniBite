import {
  checkAuth,
  getInitialLanguageForUser,
  hasRole,
  type AuthUser,
} from './auth';

export type RequiredRole = AuthUser['role'] | AuthUser['role'][];

function isAllowedRole(user: AuthUser, requiredRole?: RequiredRole): boolean {
  if (!requiredRole) {
    return true;
  }

  if (Array.isArray(requiredRole)) {
    return requiredRole.some((role) => hasRole(user, role));
  }

  return hasRole(user, requiredRole);
}

export async function resolveAuthorizedUser(
  requiredRole?: RequiredRole,
): Promise<AuthUser | null> {
  const user = await checkAuth();
  if (!user) {
    return null;
  }

  return isAllowedRole(user, requiredRole) ? user : null;
}

export function resolveInitialLanguage(user: Pick<AuthUser, 'language'>): 'en' | 'ar' {
  return getInitialLanguageForUser(user);
}
