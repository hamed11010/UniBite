'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { login, fetchActiveUniversities, type University } from '@/lib/api'
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
    // For STUDENT: validate email domain against selected university
    // For RESTAURANT_ADMIN: no domain validation (backend validates university association)
    // For SUPER_ADMIN: no restrictions
    if (selectedUniversity) {
      const emailDomain = `@${email.split('@')[1]}`
      const isStudentEmail = selectedUniversity.allowedEmailDomains.includes(emailDomain)
      
      // Note: We can't determine role before login, so we do basic validation
      // Backend will enforce proper validation
      // Frontend validation is UX-only to catch obvious errors
    }

    try {
      // Call backend login API
      const result = await login(email, password, universityId || undefined)
      
      // Store user info in sessionStorage for frontend state
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('user', JSON.stringify(result.user))
        sessionStorage.setItem('isAuthenticated', 'true')
      }
      
      // Redirect based on backend response role
      const role = result.user.role.toUpperCase()
      if (role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard')
      } else if (role === 'RESTAURANT_ADMIN') {
        router.push('/restaurant/dashboard')
      } else {
        router.push('/student/home')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Welcome back!</h1>
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
          Don't have an account?{' '}
          <Link href="/auth/signup" className={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
