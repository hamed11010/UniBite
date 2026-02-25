'use client'

import { useMemo } from 'react'
import ProtectedRolePage from '@/components/ProtectedRolePage'
import { getMessages, translate } from '@/lib/i18n'
import styles from './about.module.css'

function AboutContent({ language }: { language?: string | null }) {
  const messages = useMemo(() => getMessages(language), [language])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{translate(messages, 'about.title', 'About UniBite')}</h1>
      <div className={styles.card}>
        <p>
          UniBite is a pickup-first campus food ordering platform built by students for
          students.
        </p>
        <p>
          We focus on making campus ordering clear and reliable: browse menus, place your
          order, pay securely, and collect your meal from the restaurant counter.
        </p>
        <p>
          UniBite does not provide delivery. The experience is intentionally designed around
          on-campus pickup to keep ordering simple and fast.
        </p>
        <p>
          Our product direction is practical: secure payments, straightforward ordering,
          and tools that work for students and restaurants every day.
        </p>
      </div>
    </div>
  )
}

export default function AboutPage() {
  return <ProtectedRolePage>{(user) => <AboutContent language={user.language} />}</ProtectedRolePage>
}
