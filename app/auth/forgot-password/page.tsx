'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '@/lib/api'
import styles from '../login/auth.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) return

    setLoading(true)
    try {
      await forgotPassword(email.trim())
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Check your email</h1>
          <p className={styles.subtitle}>
            We&apos;ve sent password reset instructions to {email}
          </p>
          <div className={styles.successMessage}>
            <p>If an account exists with this email, you will receive password reset instructions shortly.</p>
          </div>
          <Link href="/auth/login" className={styles.link}>
            ← Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Forgot Password?</h1>
        <p className={styles.subtitle}>
          Enter your email address and we&apos;ll send you instructions to reset your password.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>

        <p className={styles.switchText}>
          Remember your password?{' '}
          <Link href="/auth/login" className={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
