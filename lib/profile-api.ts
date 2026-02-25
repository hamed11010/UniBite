import type { LanguageCode, UpdateProfilePayload, UserProfileResponse } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'

export async function fetchMyProfile(): Promise<UserProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/users/me/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to load profile')
  }

  return response.json()
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
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update profile')
  }

  return response.json()
}

export async function updateMyLanguage(
  language: LanguageCode,
): Promise<{ language: LanguageCode }> {
  const response = await fetch(`${API_BASE_URL}/users/me/language`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ language }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update language')
  }

  return response.json()
}
