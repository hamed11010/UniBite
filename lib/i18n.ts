import ar from '@/locales/ar.json'
import en from '@/locales/en.json'

export type Locale = 'en' | 'ar'
export type Messages = Record<string, string>

const dictionaries: Record<Locale, Messages> = {
  en,
  ar,
}

export function resolveLocale(language?: string | null): Locale {
  return language === 'ar' ? 'ar' : 'en'
}

export function getMessages(language?: string | null): Messages {
  return dictionaries[resolveLocale(language)]
}

export function translate(
  messages: Messages,
  key: string,
  fallback?: string,
): string {
  return messages[key] || fallback || key
}
