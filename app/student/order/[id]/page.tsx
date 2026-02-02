'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Order } from '@/lib/mockData'
import styles from './order.module.css'

export default function OrderStatusPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = sessionStorage.getItem('isAuthenticated')
      if (!isAuthenticated) {
        router.push('/auth/login')
        return
      }

      const orders = JSON.parse(sessionStorage.getItem('orders') || '[]')
      const currentOrder = orders.find((o: Order) => o.id === orderId)
      setOrder(currentOrder || null)

      // Simulate status updates (for demo)
      if (currentOrder && currentOrder.status === 'received') {
        setTimeout(() => {
          const updatedOrders = orders.map((o: Order) =>
            o.id === orderId ? { ...o, status: 'preparing' } : o
          )
          sessionStorage.setItem('orders', JSON.stringify(updatedOrders))
          setOrder({ ...currentOrder, status: 'preparing' })
        }, 5000)
      }
    }
  }, [orderId, router])

  if (!order) {
    return (
      <div className={styles.container}>
        <p>Order not found</p>
      </div>
    )
  }

  const getStatusMessage = () => {
    switch (order.status) {
      case 'received':
        return 'Order received by the restaurant'
      case 'preparing':
        return 'Preparing your order'
      case 'ready':
        return 'Ready for pickup!'
      case 'cancelled':
        return 'Order cancelled'
      default:
        return 'Processing...'
    }
  }

  const getStatusColor = () => {
    switch (order.status) {
      case 'received':
        return '#2196F3'
      case 'preparing':
        return '#FF9800'
      case 'ready':
        return '#4CAF50'
      case 'cancelled':
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

          {order.status === 'received' && (
            <p className={styles.estimatedTime}>
              Estimated preparation time: ~{order.estimatedTime} minutes.
            </p>
          )}

          {order.status === 'preparing' && (
            <p className={styles.calmMessage}>
              Your order is being prepared. Preparation time may vary during busy hours.
            </p>
          )}

          {order.status === 'ready' && (
            <p className={styles.pickupNote}>
              🎉 Pickup anytime during restaurant working hours.
            </p>
          )}
        </div>

        <div className={styles.orderDetails}>
          <h2 className={styles.sectionTitle}>Order Details</h2>
          <p className={styles.restaurantName}>{order.restaurantName}</p>

          <div className={styles.itemsList}>
            {order.items.map((item, index) => (
              <div key={index} className={styles.orderItem}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemName}>{item.productName}</span>
                  <span className={styles.itemQuantity}>× {item.quantity}</span>
                </div>
                {item.comment && (
                  <p className={styles.itemComment}>Note: {item.comment}</p>
                )}
                {item.sauces && item.sauces.length > 0 && (
                  <p className={styles.itemSauces}>
                    Sauces: {item.sauces.join(', ')}
                  </p>
                )}
                <p className={styles.itemPrice}>
                  {item.price * item.quantity} EGP
                </p>
              </div>
            ))}
          </div>

          <div className={styles.total}>
            <span>Total</span>
            <span className={styles.totalAmount}>{order.total} EGP</span>
          </div>
        </div>
      </div>
    </div>
  )
}
