'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import styles from './auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    // MOCK ROLE ASSIGNMENT - FOR DEMO/TESTING ONLY
    // In production, roles would be determined by backend/database
    // Explicit role assignment based on specific email patterns
    let role = 'student'
    let restaurantId = null
    let isValidEmail = false

    // Super Admin - explicit email pattern
    if (email === 'superadmintest@anything.com') {
      role = 'super_admin'
      isValidEmail = true
    }
    // Restaurant Admin - explicit email pattern
    else if (email === 'miniadmintest@anything.com') {
      role = 'restaurant_admin'
      restaurantId = 'rest1'
      isValidEmail = true
    }
    // Student - any @miuegypt.edu.eg email
    else if (email.endsWith('@miuegypt.edu.eg')) {
      role = 'student'
      isValidEmail = true
    }

    if (!isValidEmail) {
      setError('Invalid email. Use @miuegypt.edu.eg for students, or admin test emails.')
      return
    }

    // Mock login - store user in sessionStorage
    if (typeof window !== 'undefined') {
      const mockUser = {
        email,
        role,
        restaurantId,
      }
      sessionStorage.setItem('user', JSON.stringify(mockUser))
      sessionStorage.setItem('isAuthenticated', 'true')
      
      // Redirect based on role
      if (mockUser.role === 'super_admin') {
        router.push('/admin/dashboard')
      } else if (mockUser.role === 'restaurant_admin') {
        router.push('/restaurant/dashboard')
      } else {
        router.push('/student/home')
      }
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

          <button type="submit" className={styles.submitButton}>
            Sign In
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
