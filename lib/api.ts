// API utility for backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface University {
  id: string;
  name: string;
  allowedEmailDomains: string[];
  isActive: boolean;
  createdAt: string;
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
): Promise<{ user: { id: string; email: string; role: string } }> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({
      email,
      password,
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
