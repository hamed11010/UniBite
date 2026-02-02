'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import styles from '../login/auth.module.css'

export default function VerifyAccountPage() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [verified, setVerified] = useState(false)

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length === 6) {
      // Mock verification - UI only, no backend logic
      setVerified(true)
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

        <form onSubmit={handleSubmit} className={styles.form}>
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

          <button type="submit" className={styles.submitButton}>
            Verify Account
          </button>
        </form>

        <p className={styles.switchText}>
          Didn't receive the code?{' '}
          <button
            onClick={() => alert('Resend code functionality would be implemented here')}
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
