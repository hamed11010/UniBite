'use client'

import { useEffect, useState } from 'react'
import { fetchGlobalConfig } from '@/lib/api'

export default function MaintenancePage() {
    const [message, setMessage] = useState('We are currently performing maintenance. Please check back later.')

    useEffect(() => {
        fetchGlobalConfig().then(config => {
            if (config.maintenanceMessage) {
                setMessage(config.maintenanceMessage)
            }
        }).catch(console.error)
    }, [])

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#f7fafc',
            color: '#2d3748'
        }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Maintenance Mode</h1>
            <p style={{ fontSize: '1.2rem' }}>{message}</p>
        </div>
    )
}
