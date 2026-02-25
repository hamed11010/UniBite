'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import type { Socket } from 'socket.io-client'
import { useLanguage } from '@/components/LanguageProvider'
import { checkAuth } from '@/lib/auth'
import { translate } from '@/lib/i18n'
import NotificationBell from '@/components/NotificationBell'
import { createRealtimeSocket } from '@/lib/realtime'
import styles from './order.module.css'

type CancellationReasonType =
  | 'OUT_OF_STOCK'
  | 'INTERNAL_ISSUE'
  | 'BUSY'
  | 'OTHER'
  | 'SYSTEM_TIMEOUT'
type RefundStatus = 'NONE' | 'PENDING_MANUAL_REFUND' | 'REFUNDED' | 'NOT_REQUIRED'
type PaymentMethod = 'CARD'

interface OrderItem {
  id: string
  quantity: number
  priceSnapshot: number
  extrasSnapshot: any[] | null
  comment?: string
  product: {
    name: string
  }
}

interface Order {
  id: string
  orderNumber: number
  status:
    | 'RECEIVED'
    | 'PREPARING'
    | 'READY'
    | 'DELIVERED_TO_STUDENT'
    | 'COMPLETED'
    | 'CANCELLED'
  total: number
  paymentMethod: PaymentMethod
  createdAt: string
  cancellationReasonType?: CancellationReasonType | null
  cancellationComment?: string | null
  refundStatus: RefundStatus
  restaurant: {
    id: string
    name: string
  }
  items: OrderItem[]
}

export default function OrderStatusPage() {
  const router = useRouter()
  const params = useParams()
  const { messages } = useLanguage()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasShownCancellationAlert, setHasShownCancellationAlert] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)

  const getCancellationReasonLabel = useCallback((reason?: CancellationReasonType | null) => {
    switch (reason) {
      case 'OUT_OF_STOCK':
        return translate(messages, 'student.order.cancelReasonOutOfStock', 'Out of stock')
      case 'INTERNAL_ISSUE':
        return translate(messages, 'student.order.cancelReasonInternalIssue', 'Internal issue')
      case 'BUSY':
        return translate(messages, 'student.order.cancelReasonBusy', 'Restaurant is busy')
      case 'OTHER':
        return translate(messages, 'student.order.cancelReasonOther', 'Other')
      case 'SYSTEM_TIMEOUT':
        return translate(messages, 'student.order.cancelReasonTimeout', 'Pickup timeout (auto-cancelled)')
      default:
        return translate(messages, 'student.order.cancelReasonNotProvided', 'Not provided')
    }
  }, [messages])

  const getCancellationAlertText = useCallback((currentOrder: Order) => {
    if (
      currentOrder.paymentMethod === 'CARD' &&
      currentOrder.refundStatus === 'PENDING_MANUAL_REFUND'
    ) {
      return translate(
        messages,
        'student.order.refundPending',
        'Amount paid: {amount} EGP. Please visit the restaurant to collect your refund.',
      ).replace('{amount}', String(currentOrder.total))
    }
    if (currentOrder.refundStatus === 'NOT_REQUIRED') {
      return translate(messages, 'student.order.cancelledNoPayment', 'Order cancelled. No payment was taken.')
    }
    return translate(
      messages,
      'student.order.cancelledContactRestaurant',
      'Your order was cancelled. Please contact the restaurant for details.',
    )
  }, [messages])

  const fetchOrder = useCallback(async () => {
    try {
      const user = await checkAuth()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/order/${orderId}`,
        {
          credentials: 'include',
        },
      )

      if (!res.ok) {
        if (res.status === 404) {
          // Order not found
        }
        return
      }

      const data = await res.json()
      setOrder(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [orderId, router])

  useEffect(() => {
    void fetchOrder()

    // Polling is retained as a fallback when realtime events are missed.
    const interval = setInterval(fetchOrder, 10000)
    return () => clearInterval(interval)
  }, [fetchOrder])

  useEffect(() => {
    // Realtime updates provide immediate status changes for this order page.
    const realtimeSocket = createRealtimeSocket()
    setSocket(realtimeSocket)

    const onOrderStatusChanged = (payload: { id?: string }) => {
      if (!payload?.id || payload.id !== orderId) {
        return
      }
      void fetchOrder()
    }

    realtimeSocket.on('order:statusChanged', onOrderStatusChanged)

    return () => {
      realtimeSocket.off('order:statusChanged', onOrderStatusChanged)
      realtimeSocket.disconnect()
      setSocket(null)
    }
  }, [fetchOrder, orderId])

  useEffect(() => {
    if (!order || order.status !== 'CANCELLED') {
      return
    }
    if (hasShownCancellationAlert) {
      return
    }

    const showCancellationAlert = async () => {
      const Swal = (await import('sweetalert2')).default
      await Swal.fire({
        title: translate(messages, 'student.order.alertCancelledTitle', 'Order Cancelled'),
        text: getCancellationAlertText(order),
        icon: 'warning',
        footer: `${translate(messages, 'student.order.reason', 'Reason')}: ${getCancellationReasonLabel(order.cancellationReasonType)}${
          order.cancellationComment
            ? ` | ${translate(messages, 'student.order.note', 'Note')}: ${order.cancellationComment}`
            : ''
        }`,
      })
    }

    setHasShownCancellationAlert(true)
    void showCancellationAlert()
  }, [order, hasShownCancellationAlert, getCancellationAlertText, getCancellationReasonLabel, messages])

  const handleMarkCompleted = async () => {
    const Swal = (await import('sweetalert2')).default

    const result = await Swal.fire({
      title: translate(messages, 'student.order.confirmDeliveryTitle', 'Confirm Delivery'),
      text: translate(messages, 'student.order.confirmDeliveryText', 'Have you received your order?'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#d33',
      confirmButtonText: translate(messages, 'student.order.confirmDeliveryButton', 'Yes, I have it!'),
    })

    if (result.isConfirmed) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/order/${orderId}/status`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ status: 'COMPLETED' }),
          },
        )

        if (!res.ok) throw new Error(translate(messages, 'student.order.errorUpdateStatus', 'Failed to update status'))

        void fetchOrder()
        await Swal.fire(
          translate(messages, 'student.order.completedTitle', 'Completed!'),
          translate(messages, 'student.order.completedText', 'Enjoy your meal!'),
          'success',
        )
      } catch (error) {
        await Swal.fire(
          translate(messages, 'common.error', 'Error'),
          translate(messages, 'student.order.errorCouldNotUpdate', 'Could not update status'),
          'error',
        )
      }
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p>{translate(messages, 'student.order.loading', 'Loading order...')}</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <p>{translate(messages, 'student.order.notFound', 'Order not found')}</p>
        <button onClick={() => router.push('/student/home')} className={styles.backButton}>
          {translate(messages, 'student.order.backToHome', 'Back to Home')}
        </button>
      </div>
    )
  }

  const getStatusMessage = () => {
    switch (order.status) {
      case 'RECEIVED':
        return translate(messages, 'student.order.statusReceived', 'Order received by the restaurant')
      case 'PREPARING':
        return translate(messages, 'student.order.statusPreparing', 'Preparing your order')
      case 'READY':
        return translate(messages, 'student.order.statusReady', 'Ready for pickup! Please go to the counter.')
      case 'DELIVERED_TO_STUDENT':
        return translate(messages, 'student.order.statusDelivered', 'Order handed over. Please confirm completion.')
      case 'COMPLETED':
        return translate(messages, 'student.order.statusCompleted', 'Order completed. Enjoy!')
      case 'CANCELLED':
        return translate(messages, 'student.order.statusCancelled', 'Order cancelled')
      default:
        return translate(messages, 'student.order.statusProcessing', 'Processing...')
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
      case 'DELIVERED_TO_STUDENT':
        return '#607D8B'
      case 'COMPLETED':
        return '#9E9E9E'
      case 'CANCELLED':
        return '#F44336'
      default:
        return '#999'
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerActions}>
          <button onClick={() => router.push('/student/home')} className={styles.backButton}>
            {translate(messages, 'student.order.backToHome', 'Back to Home')}
          </button>
          <NotificationBell socket={socket} />
        </div>
        <h1 className={styles.title}>{translate(messages, 'student.order.title', 'Order Status')}</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.statusCard}>
          <div className={styles.statusBadge} style={{ backgroundColor: getStatusColor() }}>
            {getStatusMessage()}
          </div>

          {order.status === 'RECEIVED' && (
            <p className={styles.estimatedTime}>
              {translate(messages, 'student.order.waitingRestaurant', 'Waiting for restaurant to confirm...')}
            </p>
          )}

          {order.status === 'PREPARING' && (
            <p className={styles.calmMessage}>
              {translate(messages, 'student.order.currentPreparing', 'Current status: Preparing...')}
            </p>
          )}

          {order.status === 'CANCELLED' && (
            <div>
              <p>{translate(messages, 'student.order.cancelledText', 'This order was cancelled.')}</p>
              <p className={styles.itemSauces}>
                {translate(messages, 'student.order.reason', 'Reason')}:{' '}
                {getCancellationReasonLabel(order.cancellationReasonType)}
              </p>
              {order.cancellationComment && (
                <p className={styles.itemComment}>
                  {translate(messages, 'student.order.details', 'Details')}: {order.cancellationComment}
                </p>
              )}
              {order.paymentMethod === 'CARD' &&
                order.refundStatus === 'PENDING_MANUAL_REFUND' && (
                  <p className={styles.itemSauces}>
                    {translate(
                      messages,
                      'student.order.refundPending',
                      'Amount paid: {amount} EGP. Please visit the restaurant to collect your refund.',
                    ).replace('{amount}', String(order.total))}
                  </p>
                )}
              <p className={styles.itemSauces}>
                {translate(messages, 'student.order.refundStatus', 'Refund status')}:{' '}
                {translate(messages, `refund.${order.refundStatus}`, order.refundStatus)}
              </p>
            </div>
          )}

          {order.status === 'DELIVERED_TO_STUDENT' && (
            <div>
              <p className={styles.pickupNote}>
                {translate(messages, 'student.order.confirmPickup', 'Please confirm once pickup is complete.')}
              </p>
              <button onClick={() => void handleMarkCompleted()} className={styles.backButton}>
                {translate(messages, 'student.order.markCompleted', 'Mark as Completed')}
              </button>
            </div>
          )}
        </div>

        <div className={styles.orderDetails}>
          <h2 className={styles.sectionTitle}>{translate(messages, 'student.order.orderDetails', 'Order Details')}</h2>
          <p className={styles.restaurantName}>{order.restaurant.name}</p>
          <p className={styles.itemSauces}>
            {translate(messages, 'student.order.orderNumber', 'Order')} #{order.orderNumber}
          </p>

          <div className={styles.itemsList}>
            {order.items.map((item, index) => (
              <div key={index} className={styles.orderItem}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemName}>{item.product.name}</span>
                  <span className={styles.itemQuantity}>x {item.quantity}</span>
                </div>
                {item.comment && (
                  <p className={styles.itemComment}>
                    {translate(messages, 'student.order.note', 'Note')}: {item.comment}
                  </p>
                )}
                {Array.isArray(item.extrasSnapshot) && item.extrasSnapshot.length > 0 && (
                  <p className={styles.itemSauces}>
                    {translate(messages, 'student.order.extras', 'Extras')}:{' '}
                    {item.extrasSnapshot.map((e: any) => e.name).join(', ')}
                  </p>
                )}
                <p className={styles.itemPrice}>{item.priceSnapshot * item.quantity} EGP</p>
              </div>
            ))}
          </div>

          <div className={styles.total}>
            <span>{translate(messages, 'student.order.total', 'Total')}</span>
            <span className={styles.totalAmount}>{order.total} EGP</span>
          </div>
        </div>
      </div>
    </div>
  )
}
