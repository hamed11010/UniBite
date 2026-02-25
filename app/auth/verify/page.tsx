'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { resendVerificationCode, verifyEmailCode } from '@/lib/api'
import styles from '../login/auth.module.css'

export default function VerifyAccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    setEmail(searchParams.get('email')?.trim() || '')
  }, [searchParams])

  useEffect(() => {
    if (!verified) return
    const timer = window.setTimeout(() => {
      router.push('/auth/login')
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [verified, router])

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const fullCode = code.join('')

    if (!email) {
      setError('Email is required')
      return
    }

    if (fullCode.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)
    try {
      await verifyEmailCode(email, fullCode)
      setVerified(true)
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    if (!email) {
      setError('Email is required to resend the code')
      return
    }

    try {
      await resendVerificationCode(email)
      const Swal = (await import('sweetalert2')).default
      await Swal.fire({
        icon: 'success',
        title: 'Verification Code Sent',
        text: 'A new verification code has been sent to your email.',
        confirmButtonText: 'OK',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code')
    }
  }

  if (verified) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Account Verified!</h1>
          <p className={styles.subtitle}>
            Your account has been successfully verified.
          </p>
          <div className={styles.successMessage}>
            <p>You can now sign in to your account.</p>
          </div>
          <Link href="/auth/login" className={styles.link}>
            Continue to Login →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Verify Your Account</h1>
        <p className={styles.subtitle}>
          Enter the verification code sent to your email
        </p>
        <p className={styles.infoText}>{email || 'Enter your email below'}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          {!email && (
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
          )}

          <div className={styles.codeInputGroup}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={styles.codeInput}
                required
              />
            ))}
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>

        <p className={styles.switchText}>
          Didn&apos;t receive the code?{' '}
          <button
            onClick={() => {
              void handleResend()
            }}
            className={styles.linkButton}
          >
            Resend
          </button>
        </p>

        <p className={styles.switchText}>
          <Link href="/auth/login" className={styles.link}>
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}
