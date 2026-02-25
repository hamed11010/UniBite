'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signup } from '@/lib/api'
import styles from '../login/auth.module.css'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
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

  const handleChangeUniversity = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('selectedUniversity')
    }
    router.push('/')
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
      await signup(
        email,
        password,
        universityId,
        name.trim() || undefined,
        phone.trim() || undefined,
      )
      router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.')
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
        <h1 className={styles.title}>Create your account</h1>
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
        <p className={styles.subtitle}>Join UniBite today</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="name">Name (optional)</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

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
