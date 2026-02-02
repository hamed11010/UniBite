'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { fetchActiveUniversities, type University } from '@/lib/api'
import styles from './page.module.css'

export default function UniversitySelection() {
  const router = useRouter()
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null)

  useEffect(() => {
    async function loadUniversities() {
      try {
        const data = await fetchActiveUniversities()
        setUniversities(data)
      } catch (error) {
        console.error('Failed to load universities:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUniversities()
  }, [])

  const handleSelect = (universityId: string) => {
    setSelectedUniversity(universityId)
    // Store selected university in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedUniversity', universityId)
    }
    router.push('/auth/login')
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Choose your university</h1>
        
        {loading ? (
          <p className={styles.loading}>Loading universities...</p>
        ) : universities.length === 0 ? (
          <p className={styles.otherUniversities}>
            Universities coming soon
          </p>
        ) : (
          <>
            <div className={styles.universityList}>
              {universities.map((university) => (
                <div
                  key={university.id}
                  className={`${styles.universityCard} ${selectedUniversity === university.id ? styles.selected : ''}`}
                  onClick={() => handleSelect(university.id)}
                >
                  <div className={styles.universityName}>{university.name}</div>
                </div>
              ))}
            </div>

            <p className={styles.disclaimer}>
              UniBite is an independent platform and is not affiliated with or endorsed by any university.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
