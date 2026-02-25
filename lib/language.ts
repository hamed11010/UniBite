import { resolveLocale } from './i18n'

export function applyLanguageToDocument(language?: string | null) {
  if (typeof document === 'undefined') return

  const locale = resolveLocale(language)
  document.documentElement.lang = locale
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  document.dispatchEvent(
    new CustomEvent('unibite-language-changed', {
      detail: { locale },
    }),
  )
}
