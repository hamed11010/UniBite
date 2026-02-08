'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createOrder } from '@/lib/api'
import { checkAuth } from '@/lib/auth'
import styles from './cart.module.css'

export interface CartItemPayload {
  productId: string
  productName: string
  price: number
  quantity: number
  comment?: string
  sauces?: string[]
}

export default function CartPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [submitting, setSubmitting] = useState(false)

  // Cart is passed via URL query as base64-encoded JSON
  const { cart, restaurantId } = useMemo(() => {
    const cartParam = searchParams.get('cart')
    const restaurantIdParam = searchParams.get('restaurantId')
    if (!cartParam || !restaurantIdParam) {
      return { cart: [] as CartItemPayload[], restaurantId: null as string | null }
    }
    try {
      const decoded = JSON.parse(
        Buffer.from(cartParam, 'base64').toString('utf-8'),
      ) as CartItemPayload[]
      return { cart: decoded, restaurantId: restaurantIdParam }
    } catch {
      return { cart: [] as CartItemPayload[], restaurantId: null as string | null }
    }
  }, [searchParams])

  useEffect(() => {
    const verify = async () => {
      const user = await checkAuth()
      if (!user) {
        router.push('/auth/login')
      }
    }
    verify()
  }, [router])

  const updateQuantity = (index: number, newQuantity: number) => {
    // Cart is not persisted; quantities are fixed for this demo to keep URL simple
    if (newQuantity < 1) return
  }

  const removeItem = (index: number) => {
    // Cart editing is not supported when passed via URL; in a full app this would be stateful
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleCheckout = async () => {
    if (cart.length === 0 || !restaurantId) return

    try {
      setSubmitting(true)
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedExtras: item.sauces || [],
        comment: item.comment,
      }))
      const order = await createOrder({
        restaurantId,
        items,
        paymentMethod: 'FAKE',
      })
      router.push(`/student/order/${order.id}`)
    } catch (err) {
      console.error('Failed to create order', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!restaurantId || cart.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            ← Back
          </button>
          <h1 className={styles.title}>Cart</h1>
        </div>
        <div className={styles.empty}>
          <p>Your cart is empty</p>
          <button
            onClick={() => router.push('/student/home')}
            className={styles.shopButton}
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.title}>Cart</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.itemsSection}>
          {cart.map((item, index) => (
            <div key={index} className={styles.cartItem}>
              <div className={styles.itemInfo}>
                <h3 className={styles.itemName}>{item.productName}</h3>
                {item.comment && (
                  <p className={styles.itemComment}>Note: {item.comment}</p>
                )}
                {item.sauces && item.sauces.length > 0 && (
                  <p className={styles.itemSauces}>
                    Sauces: {item.sauces.join(', ')}
                  </p>
                )}
                <p className={styles.itemPrice}>
                  {item.price} EGP × {item.quantity} = {item.price * item.quantity} EGP
                </p>
              </div>
              <div className={styles.itemControls}>
                <div className={styles.quantityControls}>
                  <button
                    onClick={() => updateQuantity(index, item.quantity - 1)}
                    className={styles.quantityButton}
                  >
                    −
                  </button>
                  <span className={styles.quantityValue}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                    className={styles.quantityButton}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(index)}
                  className={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.warningBox}>
          <p className={styles.warningText}>
            ⚠️ Orders cannot be edited or cancelled after payment.
          </p>
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Total</span>
            <span className={styles.totalAmount}>{calculateTotal()} EGP</span>
          </div>
          <button
            onClick={handleCheckout}
            className={styles.checkoutButton}
            disabled={submitting}
          >
            {submitting ? 'Placing Order...' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>
    </div>
  )
}
