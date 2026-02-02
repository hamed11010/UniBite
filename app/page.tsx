'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './page.module.css'

export default function UniversitySelection() {
  const router = useRouter()
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null)

  const handleSelect = () => {
    setSelectedUniversity('miu')
    // Store selected university in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedUniversity', 'miu')
    }
    router.push('/auth/login')
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Choose your university</h1>
        
        <div className={styles.universityList}>
          <div
            className={`${styles.universityCard} ${selectedUniversity === 'miu' ? styles.selected : ''}`}
            onClick={handleSelect}
          >
            <div className={styles.universityName}>Misr International University</div>
          </div>
        </div>

        <p className={styles.otherUniversities}>
          Other universities coming soon
        </p>

        <p className={styles.disclaimer}>
          UniBite is an independent platform and is not affiliated with or endorsed by any university.
        </p>
      </div>
    </div>
  )
}
