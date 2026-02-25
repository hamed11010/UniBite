// API utility for backend communication
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export interface University {
  id: string;
  name: string;
  allowedEmailDomains: string[];
  isActive: boolean;
  createdAt: string;
  restaurantCount?: number;
  userCount?: number;
}

export interface CreateUniversityDto {
  name: string;
  allowedEmailDomains: string[];
}

export interface UpdateUniversityDto {
  name?: string;
  allowedEmailDomains?: string[];
  isActive?: boolean;
}

export async function fetchActiveUniversities(): Promise<University[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/university/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch universities');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching universities:', error);
    return [];
  }
}

export async function signup(
  email: string,
  password: string,
  universityId: string,
  name?: string,
  phone?: string,
  language?: 'en' | 'ar',
): Promise<{
  id: string;
  email: string;
  role: string;
  name?: string | null;
  phone?: string | null;
  language?: 'en' | 'ar';
  universityId: string;
  isVerified: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      universityId,
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
      ...(language ? { language } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Signup failed');
  }

  return response.json();
}

export async function login(
  email: string,
  password: string,
  universityId?: string,
): Promise<{
  user: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
    phone?: string | null;
    language?: 'en' | 'ar';
    universityId?: string;
    restaurantId?: string;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({
      email,
      password,
      ...(universityId && { universityId }),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  role: string;
  name?: string | null;
  phone?: string | null;
  language?: 'en' | 'ar';
  universityId?: string;
  restaurantId?: string;
  isVerified: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
  });

  if (!response.ok) {
    throw new Error('Not authenticated');
  }

  return response.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
  });
}

export type Role = 'STUDENT' | 'RESTAURANT_ADMIN' | 'SUPER_ADMIN';
export type LanguageCode = 'en' | 'ar';

export interface UserProfileResponse {
  role: Role;
  name?: string | null;
  email: string;
  phone?: string | null;
  language: LanguageCode;
  joinedDate: string;
  university?: {
    id: string;
    name: string;
  } | null;
  mostOrderedRestaurant?: string | null;
  restaurant?: {
    id: string;
    name: string;
    responsibleName: string;
    responsiblePhone: string;
    university: {
      id: string;
      name: string;
    };
  };
  analytics?: {
    mostSoldItem: string | null;
    ordersToday: number;
    totalOrders: number;
  };
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  responsibleName?: string;
  responsiblePhone?: string;
}

export async function fetchMyProfile(): Promise<UserProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/users/me/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to load profile');
  }

  return response.json();
}

export async function verifyEmailCode(
  email: string,
  code: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Email verification failed');
  }

  return response.json();
}

export async function resendVerificationCode(
  email: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to resend verification code');
  }

  return response.json();
}

export async function forgotPassword(
  email: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request password reset');
  }

  return response.json();
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      newPassword,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reset password');
  }

  return response.json();
}

export async function updateMyProfile(
  data: UpdateProfilePayload,
): Promise<UserProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/users/me/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }

  return response.json();
}

export async function updateMyLanguage(language: LanguageCode): Promise<{ language: LanguageCode }> {
  const response = await fetch(`${API_BASE_URL}/users/me/language`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ language }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update language');
  }

  return response.json();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to change password');
  }

  return response.json();
}

// Menu management (Restaurant Admin only)
export interface Category {
  id: string;
  name: string;
  restaurantId: string;
  createdAt: string;
  _count?: {
    products: number;
  };
}

export interface ProductExtra {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  hasStock: boolean;
  stockQuantity?: number | null;
  stockThreshold?: number | null;
  manuallyOutOfStock: boolean;
  categoryId: string;
  restaurantId: string;
  createdAt: string;
  extras?: ProductExtra[];
  category?: {
    id: string;
    name: string;
  };
}

export interface PublicProduct {
  id: string;
  name: string;
  price: number;
  description?: string;
  isOutOfStock: boolean;
  extras?: ProductExtra[];
}

export interface PublicCategory {
  id: string;
  name: string;
  products: PublicProduct[];
}

// Categories
export async function createCategory(name: string): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/menu/category`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create category');
  }

  return response.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/menu/category`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch categories');
  }

  return response.json();
}

export async function updateCategory(
  id: string,
  name: string,
): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/menu/category/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update category');
  }

  return response.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/menu/category/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete category');
  }
}

// Products
export interface CreateProductDto {
  name: string;
  price: number;
  description?: string;
  hasStock?: boolean;
  stockQuantity?: number;
  stockThreshold?: number;
  manuallyOutOfStock?: boolean;
  categoryId: string;
  extras?: Array<{ name: string; price?: number }>;
}

export async function createProduct(
  data: CreateProductDto,
): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/menu/product`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create product');
  }

  return response.json();
}

export async function fetchProducts(categoryId?: string): Promise<Product[]> {
  const url = categoryId
    ? `${API_BASE_URL}/menu/product?categoryId=${categoryId}`
    : `${API_BASE_URL}/menu/product`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch products');
  }

  return response.json();
}

export async function fetchProduct(id: string): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/menu/product/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch product');
  }

  return response.json();
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
  description?: string;
  hasStock?: boolean;
  stockQuantity?: number;
  stockThreshold?: number;
  manuallyOutOfStock?: boolean;
  categoryId?: string;
  extras?: Array<{ name: string; price?: number }>;
}

export async function updateProduct(
  id: string,
  data: UpdateProductDto,
): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/menu/product/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update product');
  }

  return response.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/menu/product/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete product');
  }
}

// Public menu (for students)
export async function fetchPublicMenu(
  restaurantId: string,
): Promise<PublicCategory[]> {
  const response = await fetch(
    `${API_BASE_URL}/menu/restaurant/${restaurantId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch menu');
  }

  return response.json();
}

// University management (Super Admin only)
export async function fetchAllUniversities(includeInactive = false): Promise<University[]> {
  const response = await fetch(
    `${API_BASE_URL}/university?includeInactive=${includeInactive}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch universities');
  }

  return response.json();
}

export async function fetchUniversityById(id: string): Promise<University> {
  const response = await fetch(`${API_BASE_URL}/university/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch university');
  }

  return response.json();
}

export async function createUniversity(
  data: CreateUniversityDto,
): Promise<University> {
  const response = await fetch(`${API_BASE_URL}/university`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create university');
  }

  return response.json();
}

export async function updateUniversity(
  id: string,
  data: UpdateUniversityDto,
): Promise<University> {
  const response = await fetch(`${API_BASE_URL}/university/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update university');
  }

  return response.json();
}

export async function toggleUniversityStatus(
  id: string,
  isActive: boolean,
): Promise<University> {
  const response = await fetch(`${API_BASE_URL}/university/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update university status');
  }

  return response.json();
}

// Restaurant management (Super Admin only)
export interface Restaurant {
  id: string;
  name: string;
  universityId: string;
  isDisabled?: boolean;
  disabledAt?: string | null;
  responsibleName: string;
  responsiblePhone: string;
  createdAt: string;
  university?: {
    id: string;
    name: string;
  };
  _count?: {
    users: number;
  };
}

export interface CreateRestaurantDto {
  name: string;
  universityId: string;
  responsibleName: string;
  responsiblePhone: string;
  adminEmail: string;
  adminPassword: string;
}

export async function createRestaurant(
  data: CreateRestaurantDto,
): Promise<{ restaurant: Restaurant; admin: any }> {
  const response = await fetch(`${API_BASE_URL}/restaurant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create restaurant');
  }

  return response.json();
}

export async function fetchAllRestaurants(): Promise<Restaurant[]> {
  const response = await fetch(`${API_BASE_URL}/restaurant`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch restaurants');
  }

  return response.json();
}

export async function fetchRestaurantsByUniversity(
  universityId: string,
): Promise<Restaurant[]> {
  const response = await fetch(
    `${API_BASE_URL}/restaurant/university/${universityId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch restaurants');
  }

  return response.json();
}

interface RestaurantOrderAnalyticsRow {
  status:
    | 'RECEIVED'
    | 'PREPARING'
    | 'READY'
    | 'DELIVERED_TO_STUDENT'
    | 'COMPLETED'
    | 'CANCELLED';
  total: number;
}

export interface RestaurantOrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  cancelled: number;
  completed: number;
}

export interface ServiceFeeAnalyticsRestaurant {
  restaurantId: string;
  restaurantName: string;
  totalServiceFeeLifetime: number;
  totalServiceFeeCurrentMonth: number;
  totalCardFees: number;
  contributingOrdersCount: number;
}

export interface ServiceFeeAnalyticsResponse {
  serviceFeeEnabled: boolean;
  restaurants: ServiceFeeAnalyticsRestaurant[];
}

export interface EscalatedReport {
  id: string;
  type: string;
  status: 'ESCALATED';
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  restaurant: {
    id: string;
    name: string;
  };
  student: {
    id: string;
    email: string;
    name?: string | null;
  };
  order?: {
    id: string;
    orderNumber: number;
  } | null;
}

export interface AutoDisabledRestaurant {
  id: string;
  name: string;
  disabledAt: string;
  reasonType: string;
  uniqueStudents: number;
  reasonMessage: string;
  university: {
    id: string;
    name: string;
  };
}

export async function fetchPendingOrdersCount(
  restaurantId: string,
): Promise<{ pendingOrders: number }> {
  const response = await fetch(`${API_BASE_URL}/order/restaurant/${restaurantId}/pending-count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch pending orders count');
  }

  return response.json();
}

export async function fetchUnhandledReportsCount(
  restaurantId: string,
): Promise<{ unhandledReports: number }> {
  const response = await fetch(
    `${API_BASE_URL}/reports/restaurant/${restaurantId}/unhandled-count`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch unhandled reports count');
  }

  return response.json();
}

export async function confirmStudentReportResolved(
  reportId: string,
): Promise<{ id: string; status: string; updatedAt: string }> {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/confirm`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to confirm report resolution');
  }

  return response.json();
}

export async function fetchEscalatedReportsForAdmin(): Promise<EscalatedReport[]> {
  const response = await fetch(`${API_BASE_URL}/reports/escalated`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch escalated reports');
  }

  return response.json();
}

export async function fetchAutoDisabledRestaurants(): Promise<AutoDisabledRestaurant[]> {
  const response = await fetch(`${API_BASE_URL}/restaurant/auto-disabled`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch auto-disabled restaurants');
  }

  return response.json();
}

export async function reEnableRestaurant(
  restaurantId: string,
): Promise<{ id: string; isDisabled: boolean }> {
  const response = await fetch(`${API_BASE_URL}/restaurant/${restaurantId}/re-enable`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to re-enable restaurant');
  }

  return response.json();
}

export async function fetchRestaurantOrderAnalytics(
  restaurantId: string,
): Promise<RestaurantOrderAnalytics> {
  const response = await fetch(`${API_BASE_URL}/order/restaurant/${restaurantId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch order analytics');
  }

  const orders: RestaurantOrderAnalyticsRow[] = await response.json();

  return {
    totalOrders: orders.length,
    totalRevenue: orders
      .filter((order) => order.status === 'COMPLETED')
      .reduce((sum, order) => sum + Number(order.total || 0), 0),
    cancelled: orders.filter((order) => order.status === 'CANCELLED').length,
    completed: orders.filter((order) => order.status === 'COMPLETED').length,
  };
}

export async function fetchServiceFeeAnalytics(): Promise<ServiceFeeAnalyticsResponse> {
  const response = await fetch(`${API_BASE_URL}/order/service-fee-analytics`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch service fee analytics');
  }

  return response.json();
}

// Global Config
export interface GlobalConfig {
  id: number;
  serviceFeeEnabled: boolean;
  serviceFeeAmount: number;
  orderingEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
}

export async function fetchGlobalConfig(): Promise<GlobalConfig> {
  const response = await fetch(`${API_BASE_URL}/config`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch config');
  }

  return response.json();
}

export async function updateGlobalConfig(
  data: Partial<GlobalConfig>,
): Promise<GlobalConfig> {
  const response = await fetch(`${API_BASE_URL}/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update config');
  }

  return response.json();
}

export interface NotificationItem {
  id: string;
  userId: string;
  type:
    | 'ORDER_READY'
    | 'ORDER_CANCELLED'
    | 'REPORT_RESOLVED'
    | 'ESCALATION_CREATED'
    | 'ESCALATION_RESOLVED';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch notifications');
  }

  return response.json();
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<NotificationItem> {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark notification as read');
  }

  return response.json();
}

export async function fetchUnreadNotificationsCount(): Promise<{
  unreadCount: number;
}> {
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch unread notifications');
  }

  return response.json();
}
