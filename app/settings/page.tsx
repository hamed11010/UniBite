'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import ProtectedRolePage from '@/components/ProtectedRolePage'
import { useLanguage } from '@/components/LanguageProvider'
import { type LanguageCode } from '@/lib/api'
import { getMessages, translate } from '@/lib/i18n'
import { fetchMyProfile, updateMyLanguage } from '@/lib/profile-api'
import styles from './settings.module.css'

function SettingsContent() {
  const { locale, setLanguage: setGlobalLanguage } = useLanguage()
  const [language, setSelectedLanguage] = useState<LanguageCode>('en')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await fetchMyProfile()
        setSelectedLanguage(profile.language)
      } catch (err: any) {
        setError(err.message || translate(getMessages(locale), 'settings.errorLoad', 'Failed to load settings'))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [locale])

  const messages = useMemo(() => getMessages(language), [language])

  const handleSaveLanguage = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const result = await updateMyLanguage(language)
      setGlobalLanguage(result.language)
      setSuccess(translate(messages, 'settings.successLanguage', 'Language updated successfully'))
    } catch (err: any) {
      setError(err.message || translate(messages, 'settings.errorUpdateLanguage', 'Failed to update language'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className={styles.page}>{translate(messages, 'settings.loading', 'Loading settings...')}</div>
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{translate(messages, 'settings.title', 'Settings')}</h1>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>
          {translate(messages, 'settings.languageTitle', 'Language')}
        </h2>
        <p className={styles.description}>
          {translate(messages, 'settings.languageDescription', 'Choose your preferred language.')}
        </p>
        <select
          className={styles.select}
          value={language}
          onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
        >
          <option value="en">
            {translate(messages, 'settings.languageEnglish', 'English')}
          </option>
          <option value="ar">
            {translate(messages, 'settings.languageArabic', 'Arabic')}
          </option>
        </select>
        <button className={styles.button} type="button" onClick={() => void handleSaveLanguage()} disabled={saving}>
          {saving
            ? translate(messages, 'settings.saving', 'Saving...')
            : translate(messages, 'settings.save', 'Save')}
        </button>
      </section>

      <section className={styles.shortcuts}>
        <Link href="/profile" className={styles.shortcut}>
          <h3>{translate(messages, 'settings.profileShortcut', 'Profile')}</h3>
          <p>{translate(messages, 'settings.profileShortcutDescription', 'Manage your account information.')}</p>
        </Link>
        <Link href="/settings/change-password" className={styles.shortcut}>
          <h3>{translate(messages, 'settings.passwordShortcut', 'Change Password')}</h3>
          <p>{translate(messages, 'settings.passwordShortcutDescription', 'Update your account password.')}</p>
        </Link>
      </section>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
    </div>
  )
}

export default function SettingsPage() {
  return <ProtectedRolePage>{() => <SettingsContent />}</ProtectedRolePage>
}
