'use client'

import { FormEvent, useEffect, useState } from 'react'
import ProtectedRolePage from '@/components/ProtectedRolePage'
import { useLanguage } from '@/components/LanguageProvider'
import { type UserProfileResponse } from '@/lib/api'
import { translate } from '@/lib/i18n'
import { fetchMyProfile, updateMyProfile } from '@/lib/profile-api'
import styles from './profile.module.css'

function formatDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')
}

function ProfileContent() {
  const { locale, messages } = useLanguage()
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [responsibleName, setResponsibleName] = useState('')
  const [responsiblePhone, setResponsiblePhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchMyProfile()
        setProfile(data)
        setName(data.name || '')
        setPhone(data.phone || '')
        setResponsibleName(data.restaurant?.responsibleName || '')
        setResponsiblePhone(data.restaurant?.responsiblePhone || '')
      } catch (err: any) {
        setError(err.message || translate(messages, 'profile.errorLoad', 'Failed to load profile'))
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [messages])

  const displayName = profile?.name || profile?.email.split('@')[0] || translate(messages, 'profile.greetingFallback', 'there')

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!profile) return

    setError('')
    setSuccess('')

    if (profile.role === 'STUDENT' && !name.trim()) {
      setError(translate(messages, 'profile.errorNameRequired', 'Name is required'))
      return
    }

    setSaving(true)
    try {
      const payload =
        profile.role === 'RESTAURANT_ADMIN'
          ? {
              responsibleName: responsibleName.trim(),
              responsiblePhone: responsiblePhone.trim(),
            }
          : profile.role === 'SUPER_ADMIN'
            ? { name: name.trim() }
            : { name: name.trim(), phone: phone.trim() }

      const updated = await updateMyProfile(payload)
      setProfile(updated)
      setName(updated.name || '')
      setPhone(updated.phone || '')
      setResponsibleName(updated.restaurant?.responsibleName || '')
      setResponsiblePhone(updated.restaurant?.responsiblePhone || '')
      setSuccess(translate(messages, 'profile.successUpdated', 'Profile updated successfully'))
    } catch (err: any) {
      setError(err.message || translate(messages, 'profile.errorUpdate', 'Failed to update profile'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className={styles.loading}>{translate(messages, 'profile.loading', 'Loading profile...')}</div>
  }

  if (!profile) {
    return <div className={styles.loading}>{translate(messages, 'profile.unableToLoad', 'Unable to load profile.')}</div>
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{translate(messages, 'profile.title', 'Profile')}</h1>
      <p className={styles.greeting}>
        {translate(messages, 'profile.hello', 'Hello')}, {displayName}
      </p>

      <form className={styles.card} onSubmit={onSubmit}>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        {profile.role === 'STUDENT' && (
          <>
            <label className={styles.label}>
              {translate(messages, 'profile.name', 'Name')}
              <input value={name} onChange={(e) => setName(e.target.value)} className={styles.input} required />
            </label>
            <label className={styles.label}>
              {translate(messages, 'profile.email', 'Email')}
              <input value={profile.email} className={styles.input} readOnly />
            </label>
            <label className={styles.label}>
              {translate(messages, 'profile.phoneOptional', 'Phone (optional)')}
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={styles.input} />
            </label>
            <p className={styles.meta}>
              {translate(messages, 'profile.university', 'University')}: {profile.university?.name || translate(messages, 'common.na', 'N/A')}
            </p>
            <p className={styles.meta}>
              {translate(messages, 'profile.joined', 'Joined')}: {formatDate(profile.joinedDate, locale)}
            </p>
            <p className={styles.meta}>
              {translate(messages, 'profile.mostOrderedRestaurant', 'Most ordered restaurant')}:{' '}
              {profile.mostOrderedRestaurant || translate(messages, 'common.na', 'N/A')}
            </p>
          </>
        )}

        {profile.role === 'RESTAURANT_ADMIN' && (
          <>
            <label className={styles.label}>
              {translate(messages, 'profile.responsibleName', 'Responsible Name')}
              <input
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              {translate(messages, 'profile.phone', 'Phone')}
              <input
                value={responsiblePhone}
                onChange={(e) => setResponsiblePhone(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              {translate(messages, 'profile.email', 'Email')}
              <input value={profile.email} className={styles.input} readOnly />
            </label>
            <p className={styles.meta}>
              {translate(messages, 'profile.restaurant', 'Restaurant')}:{' '}
              {profile.restaurant?.name || translate(messages, 'common.na', 'N/A')}
            </p>
            <p className={styles.meta}>
              {translate(messages, 'profile.university', 'University')}:{' '}
              {profile.restaurant?.university?.name || translate(messages, 'common.na', 'N/A')}
            </p>
            <p className={styles.meta}>
              {translate(messages, 'profile.joined', 'Joined')}: {formatDate(profile.joinedDate, locale)}
            </p>
            <p className={styles.meta}>
              {translate(messages, 'profile.mostSoldItem', 'Most sold item')}:{' '}
              {profile.analytics?.mostSoldItem || translate(messages, 'common.na', 'N/A')}
            </p>
            <p className={styles.meta}>
              {translate(messages, 'profile.ordersToday', 'Orders today')}: {profile.analytics?.ordersToday ?? 0}
            </p>
            <p className={styles.meta}>
              {translate(messages, 'profile.totalOrders', 'Total orders')}: {profile.analytics?.totalOrders ?? 0}
            </p>
          </>
        )}

        {profile.role === 'SUPER_ADMIN' && (
          <>
            <label className={styles.label}>
              {translate(messages, 'profile.name', 'Name')}
              <input value={name} onChange={(e) => setName(e.target.value)} className={styles.input} />
            </label>
            <label className={styles.label}>
              {translate(messages, 'profile.email', 'Email')}
              <input value={profile.email} className={styles.input} readOnly />
            </label>
            <p className={styles.meta}>
              {translate(messages, 'profile.joined', 'Joined')}: {formatDate(profile.joinedDate, locale)}
            </p>
          </>
        )}

        <button type="submit" className={styles.button} disabled={saving}>
          {saving
            ? translate(messages, 'profile.saving', 'Saving...')
            : translate(messages, 'profile.save', 'Save Profile')}
        </button>
      </form>
    </div>
  )
}

export default function ProfilePage() {
  return <ProtectedRolePage>{() => <ProfileContent />}</ProtectedRolePage>
}
