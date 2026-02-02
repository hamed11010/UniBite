'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { signup } from '@/lib/api'
import styles from '../login/auth.module.css'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [universityId, setUniversityId] = useState<string | null>(null)

  useEffect(() => {
    // Get selected university from sessionStorage
    if (typeof window !== 'undefined') {
      const selected = sessionStorage.getItem('selectedUniversity')
      if (!selected) {
        // Redirect to university selection if no university selected
        router.push('/')
        return
      }
      setUniversityId(selected)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (!universityId) {
      setError('Please select a university first')
      setLoading(false)
      router.push('/')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      // Call backend signup API
      const result = await signup(email, password, universityId)
      
      // Store user info in sessionStorage for frontend state
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('user', JSON.stringify(result))
        sessionStorage.setItem('isAuthenticated', 'true')
      }
      
      router.push('/student/home')
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Join UniBite today</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your university email"
              required
            />
            <p className={styles.infoText}>
              Students must sign up using their university email.
            </p>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link href="/auth/login" className={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
