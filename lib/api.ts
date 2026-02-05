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
