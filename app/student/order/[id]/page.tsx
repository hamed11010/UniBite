'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchOrderById, type Order } from '@/lib/api'
import { checkAuth } from '@/lib/auth'
import styles from './order.module.css'

export default function OrderStatusPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const user = await checkAuth()
      if (!user) {
        router.push('/auth/login')
        return
      }
      try {
        setLoading(true)
        const data = await fetchOrderById(orderId)
        setOrder(data)
      } catch (err) {
        console.error('Failed to load order', err)
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId, router])

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading order...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <p>Order not found</p>
      </div>
    )
  }

  const getStatusMessage = () => {
    switch (order.status) {
      case 'RECEIVED':
        return 'Order received by the restaurant'
      case 'PREPARING':
        return 'Preparing your order'
      case 'READY':
        return 'Ready for pickup!'
      case 'COMPLETED':
        return 'Order completed'
      case 'CANCELLED':
        return 'Order cancelled'
      default:
        return 'Processing...'
    }
  }

  const getStatusColor = () => {
    switch (order.status) {
      case 'RECEIVED':
        return '#2196F3'
      case 'PREPARING':
        return '#FF9800'
      case 'READY':
        return '#4CAF50'
      case 'COMPLETED':
        return '#4CAF50'
      case 'CANCELLED':
        return '#F44336'
      default:
        return '#999'
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push('/student/home')} className={styles.backButton}>
          ← Back to Home
        </button>
        <h1 className={styles.title}>Order Status</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.statusCard}>
          <div
            className={styles.statusBadge}
            style={{ backgroundColor: getStatusColor() }}
          >
            {getStatusMessage()}
          </div>
        </div>

        <div className={styles.orderDetails}>
          <h2 className={styles.sectionTitle}>Order Details</h2>
          <p className={styles.restaurantName}>{order.restaurant?.name}</p>

          <div className={styles.itemsList}>
            {order.items.map((item, index) => (
              <div key={index} className={styles.orderItem}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemName}>{item.productName}</span>
                  <span className={styles.itemQuantity}>× {item.quantity}</span>
                </div>
                {item.selectedExtras && item.selectedExtras.length > 0 && (
                  <p className={styles.itemSauces}>
                    Extras: {item.selectedExtras.join(', ')}
                  </p>
                )}
                <p className={styles.itemPrice}>
                  {item.unitPrice * item.quantity} EGP
                </p>
              </div>
            ))}
          </div>

          <div className={styles.total}>
            <span>Total</span>
            <span className={styles.totalAmount}>{order.totalPrice} EGP</span>
          </div>
        </div>
      </div>
    </div>
  )
}
