'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatOrderStatus, type OrderStatus } from '@/lib/status'
import styles from './page.module.css'

interface OrderItem {
  id: string
  quantity: number
  priceSnapshot: number
  comment?: string | null
  product: {
    name: string
  }
}

interface OrderDetails {
  id: string
  orderNumber: number
  status: OrderStatus
  paymentMethod: 'CARD'
  subtotal: number
  serviceFee: number
  total: number
  createdAt: string
  updatedAt: string
  cancellationComment?: string | null
  student: {
    id: string
    email?: string | null
    name?: string | null
  }
  restaurant: {
    id: string
    name: string
  }
  items: OrderItem[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'

export default function UnifiedOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) return

    const loadOrder = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${API_BASE_URL}/order/${orderId}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          const payload = await response.json()
          throw new Error(payload.message || 'Failed to load order details')
        }

        const data = (await response.json()) as OrderDetails
        setOrder(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load order details')
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    void loadOrder()
  }, [orderId])

  if (loading) {
    return <div className={styles.loading}>Loading order details...</div>
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button type="button" className={styles.backButton} onClick={() => router.back()}>
          Back
        </button>
      </div>
    )
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Order not found.</div>
        <button type="button" className={styles.backButton} onClick={() => router.back()}>
          Back
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Order Details</h1>
        <button type="button" className={styles.backButton} onClick={() => router.back()}>
          Back
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.grid}>
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Order Number:</strong> #{order.orderNumber}</p>
          <p><strong>Restaurant:</strong> {order.restaurant.name}</p>
          <p><strong>Student Name:</strong> {order.student.name || 'N/A'}</p>
          <p><strong>Student Email:</strong> {order.student.email || 'N/A'}</p>
          <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
          <p><strong>Status:</strong> {formatOrderStatus(order.status)}</p>
          <p><strong>Subtotal:</strong> {Number(order.subtotal).toFixed(2)} EGP</p>
          <p><strong>Service Fee:</strong> {Number(order.serviceFee).toFixed(2)} EGP</p>
          <p><strong>Total:</strong> {Number(order.total).toFixed(2)} EGP</p>
          <p><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Updated At:</strong> {new Date(order.updatedAt).toLocaleString()}</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Items</h2>
          <div className={styles.itemsList}>
            {order.items.map((item) => (
              <article key={item.id} className={styles.itemCard}>
                <p className={styles.itemTitle}>{item.product.name}</p>
                <p><strong>Qty:</strong> {item.quantity}</p>
                <p><strong>Price:</strong> {Number(item.priceSnapshot).toFixed(2)} EGP</p>
                {item.comment ? (
                  <p><strong>Note:</strong> {item.comment}</p>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Notes</h2>
          {order.cancellationComment ? (
            <p>{order.cancellationComment}</p>
          ) : (
            <p className={styles.empty}>No notes available.</p>
          )}
        </div>
      </div>
    </div>
  )
}
