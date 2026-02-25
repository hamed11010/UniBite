'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/api'
import styles from '../login/auth.module.css'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setToken(searchParams.get('token')?.trim() || '')
  }, [searchParams])

  useEffect(() => {
    if (!submitted) return
    const timer = window.setTimeout(() => {
      router.push('/auth/login')
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [submitted, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid reset link')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, newPassword)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Password Updated</h1>
          <p className={styles.subtitle}>Your password has been reset successfully.</p>
          <div className={styles.successMessage}>
            <p>You can now sign in with your new password.</p>
          </div>
          <Link href="/auth/login" className={styles.link}>
            Continue to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Reset Password</h1>
        <p className={styles.subtitle}>Set a new password for your UniBite account.</p>

        {!token && (
          <div className={styles.error}>
            Invalid or missing reset token. Please request a new reset link.
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              required
              minLength={8}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading || !token}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className={styles.switchText}>
          <Link href="/auth/login" className={styles.link}>
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}
