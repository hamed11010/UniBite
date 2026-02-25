import type { AuthUser } from './auth';

export const APP_ROUTE = {
  ROOT: '/',
  LOGIN: '/auth/login',
  STUDENT_HOME: '/student/home',
  RESTAURANT_DASHBOARD: '/restaurant/dashboard',
  SUPER_ADMIN_DASHBOARD: '/admin/dashboard',
} as const;

type RedirectRole = AuthUser['role'];

const ROLE_REDIRECT_MAP: Record<RedirectRole, string> = {
  STUDENT: APP_ROUTE.STUDENT_HOME,
  RESTAURANT_ADMIN: APP_ROUTE.RESTAURANT_DASHBOARD,
  SUPER_ADMIN: APP_ROUTE.SUPER_ADMIN_DASHBOARD,
};

export function isRedirectRole(value: string): value is RedirectRole {
  return value in ROLE_REDIRECT_MAP;
}

export function redirectByRole(role: string): string {
  if (!isRedirectRole(role)) {
    return APP_ROUTE.LOGIN;
  }
  return ROLE_REDIRECT_MAP[role];
}
