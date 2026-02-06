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
): Promise<{ id: string; email: string; role: string; universityId: string; isVerified: boolean }> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      universityId,
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
): Promise<{ user: { id: string; email: string; role: string; universityId?: string } }> {
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
  universityId?: string;
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
