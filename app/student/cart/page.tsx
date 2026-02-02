'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CartItem } from '@/lib/mockData'
import styles from './cart.module.css'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = sessionStorage.getItem('isAuthenticated')
      if (!isAuthenticated) {
        router.push('/auth/login')
        return
      }

      const cartData = JSON.parse(sessionStorage.getItem('cart') || '[]')
      setCart(cartData)

      // Get restaurant ID from the first item (assuming all items are from same restaurant)
      // In a real app, this would be stored separately
      if (cartData.length > 0) {
        // For demo, we'll use rest1
        setRestaurantId('rest1')
      }
    }
  }, [router])

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    const updatedCart = [...cart]
    updatedCart[index].quantity = newQuantity
    setCart(updatedCart)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cart', JSON.stringify(updatedCart))
    }
  }

  const removeItem = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index)
    setCart(updatedCart)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cart', JSON.stringify(updatedCart))
    }
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleCheckout = () => {
    if (cart.length === 0) return

    // Create order
    const order = {
      id: `order-${Date.now()}`,
      restaurantId: restaurantId || 'rest1',
      restaurantName: 'Campus Cafe', // Mock
      items: cart,
      total: calculateTotal(),
      status: 'received' as const,
      estimatedTime: 10,
      createdAt: new Date().toISOString(),
    }

    // Store order
    if (typeof window !== 'undefined') {
      const orders = JSON.parse(sessionStorage.getItem('orders') || '[]')
      orders.push(order)
      sessionStorage.setItem('orders', JSON.stringify(orders))
      sessionStorage.setItem('currentOrder', JSON.stringify(order))
      sessionStorage.removeItem('cart')
    }

    router.push(`/student/order/${order.id}`)
  }

  if (cart.length === 0) {
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
          <button onClick={handleCheckout} className={styles.checkoutButton}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}
