'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getMessages, resolveLocale, type Locale, type Messages } from '@/lib/i18n'
import { applyLanguageToDocument } from '@/lib/language'

type LanguageContextValue = {
  locale: Locale
  messages: Messages
  setLanguage: (language?: string | null) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode
  initialLanguage?: string | null
}) {
  const [locale, setLocale] = useState<Locale>(resolveLocale(initialLanguage))

  useEffect(() => {
    setLocale(resolveLocale(initialLanguage))
  }, [initialLanguage])

  useEffect(() => {
    applyLanguageToDocument(locale)
  }, [locale])

  useEffect(() => {
    const handleLanguageChanged = (event: Event) => {
      const nextLocale = (event as CustomEvent<{ locale?: string }>).detail?.locale
      setLocale(resolveLocale(nextLocale))
    }

    document.addEventListener('unibite-language-changed', handleLanguageChanged)
    return () => {
      document.removeEventListener('unibite-language-changed', handleLanguageChanged)
    }
  }, [])

  const setLanguage = useCallback((language?: string | null) => {
    setLocale(resolveLocale(language))
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      messages: getMessages(locale),
      setLanguage,
    }),
    [locale, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

const fallbackLocale: Locale = 'en'
const fallbackMessages = getMessages(fallbackLocale)

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    return {
      locale: fallbackLocale,
      messages: fallbackMessages,
      setLanguage: () => undefined,
    }
  }

  return context
}
