'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/components/LanguageProvider'
import { checkAuth } from '@/lib/auth'
import { fetchGlobalConfig } from '@/lib/api'
import { translate } from '@/lib/i18n'
import styles from './cart.module.css'

type PaymentMethod = 'CARD'

interface StoredCartItem {
  restaurantId?: string
  productId: string
  productName: string
  price: number
  quantity: number
  comment?: string
  sauces?: string[]
  addOns?: string[]
  sauceIds?: string[]
  addOnIds?: string[]
}

interface CardFormState {
  cardNumber: string
  cardHolderName: string
  expiryMonth: string
  expiryYear: string
  cvv: string
}

interface CardValidationErrors {
  cardNumber?: string
  cardHolderName?: string
  expiryMonth?: string
  expiryYear?: string
  cvv?: string
}

interface CardTouchedState {
  cardNumber: boolean
  cardHolderName: boolean
  expiryMonth: boolean
  expiryYear: boolean
  cvv: boolean
}

interface CreateOrderPayload {
  restaurantId: string
  paymentMethod: PaymentMethod
  items: Array<{
    productId: string
    quantity: number
    comment?: string
    sauces: string[]
    addOns: string[]
  }>
  cardNumber?: string
  cardHolderName?: string
  expiryMonth?: number
  expiryYear?: number
  cvv?: string
}

const EMPTY_CARD_FORM: CardFormState = {
  cardNumber: '',
  cardHolderName: '',
  expiryMonth: '',
  expiryYear: '',
  cvv: '',
}

const EMPTY_TOUCHED: CardTouchedState = {
  cardNumber: false,
  cardHolderName: false,
  expiryMonth: false,
  expiryYear: false,
  cvv: false,
}

function sanitizeCardNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16)
}

function formatCardNumber(value: string): string {
  const digits = sanitizeCardNumber(value)
  const groups = digits.match(/.{1,4}/g)
  return groups ? groups.join('-') : ''
}

function getCardValidationErrors(
  cardForm: CardFormState,
  t: (key: string, fallback: string) => string,
): CardValidationErrors {
  const errors: CardValidationErrors = {}
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const sanitizedNumber = sanitizeCardNumber(cardForm.cardNumber)
  const holderName = cardForm.cardHolderName.trim()
  const month = Number(cardForm.expiryMonth)
  const year = Number(cardForm.expiryYear)
  const cvv = cardForm.cvv.trim()

  if (!/^\d{16}$/.test(sanitizedNumber)) {
    errors.cardNumber = t('student.cart.validation.cardNumber', 'Card number must be exactly 16 digits.')
  }

  if (!holderName || holderName.length < 3) {
    errors.cardHolderName = t(
      'student.cart.validation.cardHolderNameLength',
      'Card holder name must be at least 3 characters.',
    )
  } else if (!/^[A-Za-z\s]+$/.test(holderName)) {
    errors.cardHolderName = t(
      'student.cart.validation.cardHolderNameFormat',
      'Card holder name must contain letters and spaces only.',
    )
  }

  if (!cardForm.expiryMonth || month < 1 || month > 12) {
    errors.expiryMonth = t('student.cart.validation.expiryMonth', 'Please select a valid expiry month.')
  }

  if (!cardForm.expiryYear || year < currentYear) {
    errors.expiryYear = t('student.cart.validation.expiryYear', 'Please select a valid expiry year.')
  } else if (year === currentYear && month < currentMonth) {
    errors.expiryMonth = t(
      'student.cart.validation.expiryMonthPast',
      'Expiry month cannot be in the past for this year.',
    )
  }

  if (!/^\d{3}$/.test(cvv)) {
    errors.cvv = t('student.cart.validation.cvv', 'CVV must be exactly 3 digits.')
  }

  return errors
}

function hasCardValidationErrors(errors: CardValidationErrors): boolean {
  return Object.values(errors).some((error) => Boolean(error))
}

function getApiErrorMessage(
  errorData: unknown,
  t: (key: string, fallback: string) => string,
): string {
  if (
    typeof errorData === 'object' &&
    errorData !== null &&
    'message' in errorData
  ) {
    const message = (errorData as { message: unknown }).message
    if (typeof message === 'string') {
      return message
    }
    if (Array.isArray(message)) {
      const combined = message
        .filter((item): item is string => typeof item === 'string')
        .join(', ')
      if (combined) {
        return combined
      }
    }
  }

  return t('student.cart.errorCreateOrder', 'Failed to create order')
}

export default function CartPage() {
  const router = useRouter()
  const { messages } = useLanguage()
  const t = (key: string, fallback: string) => translate(messages, key, fallback)
  const [cart, setCart] = useState<StoredCartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [serviceFee, setServiceFee] = useState(0)
  const paymentMethod: PaymentMethod = 'CARD'
  const [cardForm, setCardForm] = useState<CardFormState>(EMPTY_CARD_FORM)
  const [cardTouched, setCardTouched] = useState<CardTouchedState>(EMPTY_TOUCHED)
  const [attemptedCheckout, setAttemptedCheckout] = useState(false)

  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(
    () => Array.from({ length: 11 }, (_, index) => currentYear + index),
    [currentYear],
  )

  const cardErrors =
    paymentMethod === 'CARD' ? getCardValidationErrors(cardForm, t) : {}
  const isCardFormValid =
    paymentMethod !== 'CARD' || !hasCardValidationErrors(cardErrors)

  useEffect(() => {
    fetchGlobalConfig()
      .then((config) => {
        if (config.serviceFeeEnabled) {
          setServiceFee(config.serviceFeeAmount)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadCart = async () => {
        const user = await checkAuth()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const cartData = JSON.parse(sessionStorage.getItem('cart') || '[]')
        setCart(cartData)
      }
      void loadCart()
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
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return subtotal + serviceFee
  }

  const markCardFieldTouched = (field: keyof CardTouchedState) => {
    setCardTouched((prev) => ({ ...prev, [field]: true }))
  }

  const showCardError = (field: keyof CardTouchedState): boolean =>
    paymentMethod === 'CARD' &&
    Boolean(cardErrors[field]) &&
    (attemptedCheckout || cardTouched[field])

  const handleCheckout = async () => {
    if (cart.length === 0) return

    if (paymentMethod === 'CARD' && !isCardFormValid) {
      setAttemptedCheckout(true)
      return
    }

    const Swal = (await import('sweetalert2')).default
    const confirmOrder = await Swal.fire({
      title: t('student.cart.confirmTitle', 'Confirm Order'),
      text: t('student.cart.confirmText', 'After placing this order, it cannot be edited or cancelled.'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('student.cart.confirmButton', 'Place Order'),
      cancelButtonText: t('student.cart.reviewButton', 'Review Cart'),
    })

    if (!confirmOrder.isConfirmed) {
      return
    }

    setLoading(true)

    try {
      const user = await checkAuth()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const restaurantId = cart[0]?.restaurantId

      if (!restaurantId) {
        await Swal.fire({
          icon: 'error',
          title: t('student.cart.cartErrorTitle', 'Cart Error'),
          text: t(
            'student.cart.cartErrorText',
            'Your cart contains inconsistent data. Please clear your cart and try again.',
          ),
        })
        return
      }

      const payload: CreateOrderPayload = {
        restaurantId,
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          comment: item.comment,
          sauces: item.sauceIds || [],
          addOns: item.addOnIds || [],
        })),
      }

      if (paymentMethod === 'CARD') {
        payload.cardNumber = sanitizeCardNumber(cardForm.cardNumber)
        payload.cardHolderName = cardForm.cardHolderName.trim()
        payload.expiryMonth = Number(cardForm.expiryMonth)
        payload.expiryYear = Number(cardForm.expiryYear)
        payload.cvv = cardForm.cvv
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) {
        const errorData: unknown = await res.json()
        throw new Error(getApiErrorMessage(errorData, t))
      }

      const order: { id: string } = await res.json()

      await Swal.fire({
        icon: 'success',
        title: t('student.cart.successTitle', 'Order Placed!'),
        text: t('student.cart.successText', 'Your order has been sent to the restaurant.'),
        timer: 2000,
        showConfirmButton: false,
      })

      setCart([])
      setCardForm(EMPTY_CARD_FORM)
      setCardTouched(EMPTY_TOUCHED)
      setAttemptedCheckout(false)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('cart')
      }

      router.push(`/student/order/${order.id}`)
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t('student.cart.errorUnknown', 'Something went wrong. Please try again.')
      await Swal.fire({
        icon: 'error',
        title: t('student.cart.errorTitle', 'Order Failed'),
        text: message,
      })
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            {t('student.cart.back', 'Back')}
          </button>
          <h1 className={styles.title}>{t('student.cart.title', 'Cart')}</h1>
        </div>
        <div className={styles.empty}>
          <p>{t('student.cart.empty', 'Your cart is empty')}</p>
          <button onClick={() => router.push('/student/home')} className={styles.shopButton}>
            {t('student.cart.browseRestaurants', 'Browse Restaurants')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          {t('student.cart.back', 'Back')}
        </button>
        <h1 className={styles.title}>{t('student.cart.title', 'Cart')}</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.itemsSection}>
          {cart.map((item, index) => (
            <div key={index} className={styles.cartItem}>
              <div className={styles.itemInfo}>
                <h3 className={styles.itemName}>{item.productName}</h3>
                {item.comment && (
                  <p className={styles.itemComment}>
                    {t('student.cart.note', 'Note')}: {item.comment}
                  </p>
                )}
                {item.sauces && item.sauces.length > 0 && (
                  <p className={styles.itemSauces}>
                    {t('student.cart.sauces', 'Sauces')}: {item.sauces.join(', ')}
                  </p>
                )}
                {item.addOns && item.addOns.length > 0 && (
                  <p className={styles.itemSauces}>
                    {t('student.cart.addOns', 'Add-ons')}: {item.addOns.join(', ')}
                  </p>
                )}
                <p className={styles.itemPrice}>
                  {item.price} EGP x {item.quantity} = {item.price * item.quantity} EGP
                </p>
              </div>
              <div className={styles.itemControls}>
                <div className={styles.quantityControls}>
                  <button
                    onClick={() => updateQuantity(index, item.quantity - 1)}
                    className={styles.quantityButton}
                  >
                    -
                  </button>
                  <span className={styles.quantityValue}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                    className={styles.quantityButton}
                  >
                    +
                  </button>
                </div>
                <button onClick={() => removeItem(index)} className={styles.removeButton}>
                  {t('student.cart.remove', 'Remove')}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.warningBox}>
          <p className={styles.warningText}>
            {t('student.cart.warning', 'Orders cannot be edited or cancelled after payment.')}
          </p>
        </div>

        <div className={styles.paymentSection}>
          <h2 className={styles.sectionTitle}>{t('student.cart.paymentMethod', 'Payment Method')}</h2>
          <label className={styles.paymentOption}>
            <input
              type="radio"
              name="paymentMethod"
              value="CARD"
              checked
              readOnly
            />
            <span>{t('student.cart.payWithCard', 'Pay with Card')}</span>
          </label>

          {paymentMethod === 'CARD' && (
            <div className={styles.cardForm}>
              <div className={styles.inputGroup}>
                <label htmlFor="cardNumber">{t('student.cart.cardNumber', 'Card Number')}</label>
                <input
                  id="cardNumber"
                  type="text"
                  inputMode="numeric"
                  value={cardForm.cardNumber}
                  placeholder={t('student.cart.cardNumberPlaceholder', '1234-5678-9012-3456')}
                  onChange={(event) => {
                    setCardForm((prev) => ({
                      ...prev,
                      cardNumber: formatCardNumber(event.target.value),
                    }))
                  }}
                  onBlur={() => markCardFieldTouched('cardNumber')}
                />
                {showCardError('cardNumber') && (
                  <p className={styles.inputError}>{cardErrors.cardNumber}</p>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="cardHolderName">{t('student.cart.cardHolderName', 'Card Holder Name')}</label>
                <input
                  id="cardHolderName"
                  type="text"
                  value={cardForm.cardHolderName}
                  placeholder={t('student.cart.cardHolderPlaceholder', 'Name on card')}
                  onChange={(event) => {
                    const normalized = event.target.value.replace(/[^A-Za-z\s]/g, '')
                    setCardForm((prev) => ({
                      ...prev,
                      cardHolderName: normalized,
                    }))
                  }}
                  onBlur={() => markCardFieldTouched('cardHolderName')}
                />
                {showCardError('cardHolderName') && (
                  <p className={styles.inputError}>{cardErrors.cardHolderName}</p>
                )}
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label htmlFor="expiryMonth">{t('student.cart.expiryMonth', 'Expiry Month')}</label>
                  <select
                    id="expiryMonth"
                    value={cardForm.expiryMonth}
                    onChange={(event) => {
                      setCardForm((prev) => ({
                        ...prev,
                        expiryMonth: event.target.value,
                      }))
                    }}
                    onBlur={() => markCardFieldTouched('expiryMonth')}
                  >
                    <option value="">{t('student.cart.month', 'Month')}</option>
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                      <option key={month} value={String(month)}>
                        {String(month).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  {showCardError('expiryMonth') && (
                    <p className={styles.inputError}>{cardErrors.expiryMonth}</p>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="expiryYear">{t('student.cart.expiryYear', 'Expiry Year')}</label>
                  <select
                    id="expiryYear"
                    value={cardForm.expiryYear}
                    onChange={(event) => {
                      setCardForm((prev) => ({
                        ...prev,
                        expiryYear: event.target.value,
                      }))
                    }}
                    onBlur={() => markCardFieldTouched('expiryYear')}
                  >
                    <option value="">{t('student.cart.year', 'Year')}</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {showCardError('expiryYear') && (
                    <p className={styles.inputError}>{cardErrors.expiryYear}</p>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="cvv">{t('student.cart.cvv', 'CVV')}</label>
                  <input
                    id="cvv"
                    type="password"
                    inputMode="numeric"
                    value={cardForm.cvv}
                    placeholder={t('student.cart.cvvPlaceholder', '123')}
                    maxLength={3}
                    onChange={(event) => {
                      const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 3)
                      setCardForm((prev) => ({
                        ...prev,
                        cvv: digitsOnly,
                      }))
                    }}
                    onBlur={() => markCardFieldTouched('cvv')}
                  />
                  {showCardError('cvv') && <p className={styles.inputError}>{cardErrors.cvv}</p>}
                </div>
              </div>

              <p className={styles.secureNote}>{t('student.cart.secureNote', 'Your card details are encrypted and never stored.')}</p>
            </div>
          )}
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>{t('student.cart.subtotal', 'Subtotal')}</span>
            <span>{cart.reduce((sum, item) => sum + item.price * item.quantity, 0)} EGP</span>
          </div>
          {serviceFee > 0 && (
            <div className={styles.summaryRow}>
              <span>{t('student.cart.serviceFee', 'Service Fee')}</span>
              <span>{serviceFee} EGP</span>
            </div>
          )}
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>{t('student.cart.total', 'Total')}</span>
            <span className={styles.totalAmount}>{calculateTotal()} EGP</span>
          </div>
          <button
            onClick={() => void handleCheckout()}
            className={styles.checkoutButton}
            disabled={loading || !isCardFormValid}
          >
            {loading
              ? t('student.cart.processing', 'Processing...')
              : t('student.cart.checkout', 'Proceed to Checkout')}
          </button>
        </div>
      </div>
    </div>
  )
}

