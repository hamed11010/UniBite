import Image from 'next/image'
import styles from './loading.module.css'

export default function Loading() {
  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-label="Loading page">
      <div className={styles.progressTrack} aria-hidden="true">
        <span className={styles.progressBar} />
      </div>
      <div className={styles.loaderCard}>
        <Image
          src="/logo-icon.svg"
          alt="UniBite"
          className={styles.loadingLogo}
          width={34}
          height={34}
          priority
        />
      </div>
    </div>
  )
}
