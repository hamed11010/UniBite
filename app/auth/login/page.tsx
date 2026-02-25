'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { login, fetchActiveUniversities, type University } from '@/lib/api'
import { APP_ROUTE, redirectByRole } from '@/lib/redirectByRole'
import styles from './auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [universityId, setUniversityId] = useState<string | null>(null)
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)

  useEffect(() => {
    // Get selected university from sessionStorage
    if (typeof window !== 'undefined') {
      const selected = sessionStorage.getItem('selectedUniversity')
      if (selected) {
        setUniversityId(selected)
        // Fetch university details for validation
        fetchActiveUniversities().then((universities) => {
          const uni = universities.find((u) => u.id === selected)
          if (uni) {
            setSelectedUniversity(uni)
          }
        })
      }
    }
  }, [])

  const handleChangeUniversity = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('selectedUniversity')
    }
    router.push(APP_ROUTE.ROOT)
  }

  const handleGoogleAuth = () => {
    if (typeof window === 'undefined') return
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'
    window.location.href = `${apiBaseUrl}/auth/google`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    // Context-aware validation based on role (frontend UX only, backend is authority)
    if (selectedUniversity) {
      const emailDomain = `@${email.split('@')[1]}`
      const isStudentEmail = selectedUniversity.allowedEmailDomains.includes(emailDomain)
      // UX-only validation; backend enforces rules
    }

    try {
      // Call backend login API (cookie-based auth)
      const result = await login(email, password, universityId || undefined)

      const role = result.user.role.toUpperCase()
      router.push(redirectByRole(role))
    } catch (err: any) {
      // Display clear error messages
      const errorMessage = err.message || 'Login failed. Please check your credentials and try again.'
      
      // Check for specific error types
      if (errorMessage.includes('Account not associated with selected university')) {
        setError('Account not associated with selected university. Please select the correct university.')
      } else if (errorMessage.includes('Invalid credentials')) {
        setError('Invalid email or password. Please check your credentials.')
      } else if (errorMessage.includes('University selection is required')) {
        setError('Please select a university first.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <Image
            src="/logo-full.svg"
            alt="UniBite"
            className={styles.authLogo}
            width={220}
            height={124}
            priority
          />
        </div>
        <h1 className={styles.title}>Welcome back!</h1>
        <button
          type="button"
          onClick={handleChangeUniversity}
          style={{
            display: 'block',
            margin: '0 auto 12px',
            padding: '6px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            background: '#f8fafc',
            color: '#334155',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Change University
        </button>
        <p className={styles.subtitle}>Sign in to continue</p>

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

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {!universityId && (
            <p className={styles.infoText} style={{ color: '#ff6b6b', marginBottom: '1rem' }}>
              Please select a university first.
            </p>
          )}

          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <svg
              aria-hidden="true"
              className={styles.googleIcon}
              viewBox="0 0 24 24"
            >
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 2.9 14.7 2 12 2 6.9 2 2.8 6.3 2.8 11.6S6.9 21.2 12 21.2c6.9 0 9.1-4.9 9.1-7.4 0-.5-.1-.9-.1-1.2H12z"
              />
              <path
                fill="#34A853"
                d="M2.8 11.6c0 1.7.6 3.2 1.6 4.5l3-2.3c-.4-.6-.6-1.4-.6-2.2s.2-1.5.6-2.2l-3-2.3c-1 1.3-1.6 2.9-1.6 4.5z"
              />
              <path
                fill="#4A90E2"
                d="M12 21.2c2.7 0 5-.9 6.7-2.5l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2l-3 2.3c1.8 3.6 5.3 6 8.6 6z"
              />
              <path
                fill="#FBBC05"
                d="M6.4 9c.8-2.4 3-4.2 5.6-4.2 1.4 0 2.5.5 3.4 1.4l2.8-2.8C17 2.2 14.7 2 12 2 8.7 2 5.2 4.4 3.4 8l3 2.3z"
              />
            </svg>
            Continue with Google
          </button>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || !universityId}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.switchText}>
          <Link href="/auth/forgot-password" className={styles.link}>
            Forgot password?
          </Link>
        </p>

        <p className={styles.switchText}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
