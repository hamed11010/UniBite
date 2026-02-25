'use client'

import { FormEvent, useState } from 'react'
import ProtectedRolePage from '@/components/ProtectedRolePage'
import { useLanguage } from '@/components/LanguageProvider'
import { changePassword } from '@/lib/api'
import { translate } from '@/lib/i18n'
import styles from './change-password.module.css'

function ChangePasswordContent() {
  const { messages } = useLanguage()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword.length < 8) {
      setError(
        translate(
          messages,
          'changePassword.errorMinLength',
          'New password must be at least 8 characters',
        ),
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setError(
        translate(
          messages,
          'changePassword.errorMismatch',
          'New password and confirmation do not match',
        ),
      )
      return
    }

    setSaving(true)
    try {
      const result = await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(result.message)
    } catch (err: any) {
      setError(err.message || translate(messages, 'changePassword.errorUpdate', 'Failed to change password'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{translate(messages, 'changePassword.title', 'Change Password')}</h1>
      <form className={styles.card} onSubmit={handleSubmit}>
        <label className={styles.label}>
          {translate(messages, 'changePassword.currentPassword', 'Current Password')}
          <input
            type="password"
            className={styles.input}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          {translate(messages, 'changePassword.newPassword', 'New Password')}
          <input
            type="password"
            className={styles.input}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <label className={styles.label}>
          {translate(messages, 'changePassword.confirmPassword', 'Confirm New Password')}
          <input
            type="password"
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <button type="submit" className={styles.button} disabled={saving}>
          {saving
            ? translate(messages, 'changePassword.updating', 'Updating...')
            : translate(messages, 'changePassword.updatePassword', 'Update Password')}
        </button>
      </form>
    </div>
  )
}

export default function ChangePasswordPage() {
  return <ProtectedRolePage>{() => <ChangePasswordContent />}</ProtectedRolePage>
}
