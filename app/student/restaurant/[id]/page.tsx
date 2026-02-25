'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/components/LanguageProvider'
import { fetchPublicMenu, type PublicCategory } from '@/lib/api'
import { checkAuth } from '@/lib/auth'
import { translate } from '@/lib/i18n'
import styles from './menu.module.css'

type ReportType =
  | 'ORDER_NOT_READY'
  | 'WRONG_ORDER'
  | 'CLOSED_BUT_MARKED_OPEN'
  | 'PAYMENT_ISSUE'
  | 'OTHER'

type ReportReasonKey =
  | 'closed'
  | 'notPrepared'
  | 'notUsingApp'
  | 'other'

interface UIExtra {
  id: string
  name: string
  price: number
}

interface UIProduct {
  id: string
  name: string
  price: number
  description: string
  categoryName: string
  isOutOfStock: boolean
  allowSauces: boolean
  sauces: UIExtra[]
  addOns: UIExtra[]
  image?: string
}

interface RestaurantSummary {
  id: string
  name: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'

const REPORT_OPTIONS: Array<{ key: ReportReasonKey; type: ReportType; labelKey: string; fallback: string }> = [
  {
    key: 'closed',
    type: 'CLOSED_BUT_MARKED_OPEN',
    labelKey: 'student.menu.reportReasonClosed',
    fallback: 'Restaurant is closed',
  },
  {
    key: 'notPrepared',
    type: 'ORDER_NOT_READY',
    labelKey: 'student.menu.reportReasonNotPrepared',
    fallback: 'Order accepted but not prepared',
  },
  {
    key: 'notUsingApp',
    type: 'OTHER',
    labelKey: 'student.menu.reportReasonNotUsingApp',
    fallback: "Restaurant says they don't use this app",
  },
  {
    key: 'other',
    type: 'OTHER',
    labelKey: 'student.menu.reportReasonOther',
    fallback: 'Other issue',
  },
]

function getCategoryAnchorId(categoryName: string): string {
  return `category-${categoryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`
}

export default function RestaurantMenuPage() {
  const router = useRouter()
  const params = useParams()
  const { messages } = useLanguage()
  const t = (key: string, fallback: string) => translate(messages, key, fallback)
  const restaurantId = params.id as string

  const [restaurant, setRestaurant] = useState<RestaurantSummary | null>(null)
  const [isStudent, setIsStudent] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReasonKey>('closed')
  const [reportComment, setReportComment] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)

  const [menu, setMenu] = useState<UIProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<UIProduct | null>(null)
  const [activeCategory, setActiveCategory] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [comment, setComment] = useState('')
  const [selectedSauces, setSelectedSauces] = useState<string[]>([])
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [showSauces, setShowSauces] = useState(false)
  const [showAddOns, setShowAddOns] = useState(false)

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const user = await checkAuth()
        if (!user) {
          router.push('/auth/login')
          return
        }

        if (user.role === 'STUDENT') {
          setIsStudent(true)
        }

        const categories = await fetchPublicMenu(restaurantId)
        const mappedProducts: UIProduct[] = categories.flatMap((cat: PublicCategory) =>
          cat.products.map((prod) => ({
            id: prod.id,
            name: prod.name,
            price: prod.price,
            description: prod.description || '',
            categoryName: cat.name,
            isOutOfStock: Boolean(prod.isOutOfStock),
            allowSauces: (prod.extras?.length || 0) > 0,
            sauces:
              prod.extras?.map((extra) => ({
                id: extra.id,
                name: extra.name,
                price: extra.price,
              })) || [],
            addOns: [],
          })),
        )
        setMenu(mappedProducts)

        if (user.universityId) {
          const res = await fetch(
            `${API_BASE_URL}/restaurant/public/university/${user.universityId}`,
            { credentials: 'include' },
          )

          if (res.ok) {
            const restaurants: RestaurantSummary[] = await res.json()
            const currentRestaurant = restaurants.find((r) => r.id === restaurantId)
            if (currentRestaurant) {
              setRestaurant(currentRestaurant)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load restaurant menu page:', error)
        setMenu([])
      } finally {
        setLoading(false)
      }
    }

    void loadPageData()
  }, [restaurantId, router])

  const isProductAvailable = (product: UIProduct): boolean => {
    return !product.isOutOfStock
  }

  const handleProductClick = (product: UIProduct) => {
    if (!isProductAvailable(product)) {
      return
    }

    setSelectedProduct(product)
    setQuantity(1)
    setComment('')
    setSelectedSauces([])
    setSelectedAddOns([])
    setShowSauces(false)
    setShowAddOns(false)
  }

  const handleAddToCart = () => {
    if (!selectedProduct || typeof window === 'undefined') return

    let itemPrice = selectedProduct.price
    const selectedSauceNames: string[] = []
    const selectedAddOnNames: string[] = []
    const selectedSauceIds: string[] = []
    const selectedAddOnIds: string[] = []

    selectedSauces.forEach((sauceId) => {
      const sauce = selectedProduct.sauces.find((s) => s.id === sauceId)
      if (sauce) {
        itemPrice += sauce.price
        selectedSauceNames.push(sauce.name)
        selectedSauceIds.push(sauce.id)
      }
    })

    selectedAddOns.forEach((addOnId) => {
      const addOn = selectedProduct.addOns.find((a) => a.id === addOnId)
      if (addOn) {
        itemPrice += addOn.price
        selectedAddOnNames.push(addOn.name)
        selectedAddOnIds.push(addOn.id)
      }
    })

    const cartItem = {
      restaurantId,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      price: itemPrice,
      quantity,
      comment: comment.trim() || undefined,
      sauces: selectedSauceNames.length > 0 ? selectedSauceNames : undefined,
      addOns: selectedAddOnNames.length > 0 ? selectedAddOnNames : undefined,
      sauceIds: selectedSauceIds.length > 0 ? selectedSauceIds : undefined,
      addOnIds: selectedAddOnIds.length > 0 ? selectedAddOnIds : undefined,
    }

    const existingCart = JSON.parse(sessionStorage.getItem('cart') || '[]')
    existingCart.push(cartItem)
    sessionStorage.setItem('cart', JSON.stringify(existingCart))

    setSelectedProduct(null)
    setQuantity(1)
    setComment('')
    setSelectedSauces([])
    setSelectedAddOns([])
    setShowSauces(false)
    setShowAddOns(false)
  }

  const toggleSauce = (sauceId: string) => {
    setSelectedSauces((prev) =>
      prev.includes(sauceId)
        ? prev.filter((id) => id !== sauceId)
        : [...prev, sauceId],
    )
  }

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId],
    )
  }

  const calculateTotal = () => {
    if (!selectedProduct) return 0

    let total = selectedProduct.price * quantity

    selectedSauces.forEach((sauceId) => {
      const sauce = selectedProduct.sauces.find((s) => s.id === sauceId)
      if (sauce) {
        total += sauce.price * quantity
      }
    })

    selectedAddOns.forEach((addOnId) => {
      const addOn = selectedProduct.addOns.find((a) => a.id === addOnId)
      if (addOn) {
        total += addOn.price * quantity
      }
    })

    return total
  }

  const handleSubmitReport = async () => {
    const selectedReason = REPORT_OPTIONS.find((option) => option.key === reportReason)
    const reportType = selectedReason?.type || 'OTHER'

    try {
      const res = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          restaurantId,
          type: reportType,
          comment: reportComment.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || t('student.menu.errorSubmitReport', 'Failed to submit report'))
      }

      setReportSubmitted(true)
    } catch (error) {
      console.error('Failed to submit report', error)
      const Swal = (await import('sweetalert2')).default
      Swal.fire(
        t('common.error', 'Error'),
        t('student.menu.errorCouldNotSubmitReport', 'Could not submit report'),
        'error',
      )
    }
  }

  const menuByCategory = useMemo(() => {
    return menu.reduce<Record<string, UIProduct[]>>((acc, product) => {
      if (!acc[product.categoryName]) {
        acc[product.categoryName] = []
      }
      acc[product.categoryName].push(product)
      return acc
    }, {})
  }, [menu])

  const categoryNames = useMemo(() => Object.keys(menuByCategory), [menuByCategory])

  useEffect(() => {
    if (!categoryNames.length) return
    if (!activeCategory || !categoryNames.includes(activeCategory)) {
      setActiveCategory(categoryNames[0])
    }
  }, [activeCategory, categoryNames])

  useEffect(() => {
    if (typeof window === 'undefined' || categoryNames.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)
        if (visibleEntries.length === 0) return

        visibleEntries.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        )
        const topEntry = visibleEntries[0]
        const category = topEntry.target.getAttribute('data-category-name')
        if (category) {
          setActiveCategory(category)
        }
      },
      {
        rootMargin: '-170px 0px -55% 0px',
        threshold: [0.1, 0.25, 0.5],
      },
    )

    categoryNames.forEach((category) => {
      const element = document.getElementById(getCategoryAnchorId(category))
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [categoryNames])

  const handleCategoryClick = (category: string) => {
    const section = document.getElementById(getCategoryAnchorId(category))
    if (!section) return

    setActiveCategory(category)
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const cartCount =
    typeof window !== 'undefined'
      ? JSON.parse(sessionStorage.getItem('cart') || '[]').length
      : 0

  if (!restaurant) {
    return (
      <div className={styles.container}>
        <p>{t('student.menu.restaurantNotFound', 'Restaurant not found')}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          {t('student.menu.back', 'Back')}
        </button>
        <h1 className={styles.restaurantName}>{restaurant.name}</h1>
        <div className={styles.headerActions}>
          {isStudent && (
            <button
              type="button"
              className={styles.reportButton}
              onClick={() => {
                setShowReportModal(true)
                setReportSubmitted(false)
              }}
            >
              {t('student.menu.reportIssue', 'Report an issue')}
            </button>
          )}
          <button
            onClick={() => router.push('/student/cart')}
            className={styles.cartButton}
          >
            {t('student.menu.cart', 'Cart')} ({cartCount})
          </button>
        </div>
      </div>

      {categoryNames.length > 0 && (
        <div className={styles.categoryNavWrapper}>
          <div
            className={styles.categoryNav}
            role="tablist"
            aria-label={t('student.menu.categoriesAria', 'Menu categories')}
          >
            {categoryNames.map((category) => (
              <button
                key={category}
                type="button"
                className={`${styles.categoryNavButton} ${activeCategory === category ? styles.categoryNavButtonActive : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.menuContent}>
        {loading ? (
          <div className={styles.loading}>{t('student.menu.loading', 'Loading menu...')}</div>
        ) : Object.keys(menuByCategory).length === 0 ? (
          <div className={styles.emptyMenu}>{t('student.menu.empty', 'No menu items available')}</div>
        ) : (
          Object.entries(menuByCategory).map(([category, products]) => (
            <div
              key={category}
              id={getCategoryAnchorId(category)}
              data-category-name={category}
              className={styles.categorySection}
            >
              <h2 className={styles.categoryTitle}>{category}</h2>
              <div className={styles.productGrid}>
                {products.map((product) => {
                  const available = isProductAvailable(product)

                  return (
                    <div
                      key={product.id}
                      className={`${styles.productCard} ${!available ? styles.outOfStock : ''}`}
                      onClick={() => handleProductClick(product)}
                      style={{ cursor: available ? 'pointer' : 'not-allowed' }}
                    >
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          className={styles.productImage}
                          width={320}
                          height={180}
                        />
                      ) : (
                        <div className={styles.productImagePlaceholder}>
                          <Image
                            src="/logo-icon.svg"
                            alt=""
                            className={styles.placeholderLogo}
                            width={56}
                            height={56}
                            aria-hidden="true"
                          />
                        </div>
                      )}
                      <div className={styles.productInfo}>
                        <div className={styles.productHeader}>
                          <h3 className={styles.productName}>{product.name}</h3>
                          {!available && (
                            <span className={styles.outOfStockBadge}>
                              {t('student.menu.outOfStock', 'Out of Stock')}
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className={styles.productDescription}>{product.description}</p>
                        )}
                        <p className={styles.productPrice}>{product.price} EGP</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedProduct && (
        <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setSelectedProduct(null)}
            >
              x
            </button>
            <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
            <p className={styles.modalPrice}>{selectedProduct.price} EGP</p>

            <div className={styles.quantitySelector}>
              <label>{t('student.menu.quantity', 'Quantity')}</label>
              <div className={styles.quantityControls}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={styles.quantityButton}
                >
                  -
                </button>
                <span className={styles.quantityValue}>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className={styles.quantityButton}
                >
                  +
                </button>
              </div>
            </div>

            {selectedProduct.allowSauces && (
              <div className={styles.saucesSection}>
                <button
                  type="button"
                  className={styles.expandToggleButton}
                  onClick={() => setShowSauces((prev) => !prev)}
                >
                  {showSauces
                    ? t('student.menu.hideSauces', 'Hide Sauces')
                    : t('student.menu.viewSauces', 'View Sauces')}
                </button>
                {showSauces && (
                  <div className={styles.saucesList}>
                    {selectedProduct.sauces.map((sauce) => (
                      <label key={sauce.id} className={styles.sauceOption}>
                        <input
                          type="checkbox"
                          checked={selectedSauces.includes(sauce.id)}
                          onChange={() => toggleSauce(sauce.id)}
                        />
                        <span>
                          {sauce.name}{' '}
                          {sauce.price > 0
                            ? `(+${sauce.price} EGP)`
                            : t('student.menu.free', '(Free)')}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedProduct.addOns.length > 0 && (
              <div className={styles.saucesSection}>
                <button
                  type="button"
                  className={styles.expandToggleButton}
                  onClick={() => setShowAddOns((prev) => !prev)}
                >
                  {showAddOns
                    ? t('student.menu.hideExtras', 'Hide Extras')
                    : t('student.menu.viewExtras', 'View Extras')}
                </button>
                {showAddOns && (
                  <div className={styles.saucesList}>
                    {selectedProduct.addOns.map((addOn) => (
                      <label key={addOn.id} className={styles.sauceOption}>
                        <input
                          type="checkbox"
                          checked={selectedAddOns.includes(addOn.id)}
                          onChange={() => toggleAddOn(addOn.id)}
                        />
                        <span>
                          {addOn.name}{' '}
                          {addOn.price > 0
                            ? `(+${addOn.price} EGP)`
                            : t('student.menu.free', '(Free)')}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={styles.commentSection}>
              <label htmlFor="comment">
                {t('student.menu.notesOptional', 'Any notes for the restaurant? (optional)')}
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('student.menu.notesPlaceholder', 'E.g., No onions, extra cheese...')}
                className={styles.commentInput}
                rows={3}
              />
            </div>

            <button onClick={handleAddToCart} className={styles.addToCartButton}>
              {t('student.menu.addToCart', 'Add to Cart')} - {calculateTotal()} EGP
            </button>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowReportModal(false)}>
              x
            </button>
            <h2 className={styles.modalTitle}>{t('student.menu.reportIssue', 'Report an issue')}</h2>

            {!reportSubmitted ? (
              <>
                <label className={styles.reportLabel}>{t('student.menu.reason', 'Reason')}</label>
                <select
                  className={styles.reportSelect}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReasonKey)}
                >
                  {REPORT_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {t(option.labelKey, option.fallback)}
                    </option>
                  ))}
                </select>

                <label className={styles.reportLabel}>
                  {t('student.menu.additionalDetailsOptional', 'Additional details (optional)')}
                </label>
                <textarea
                  className={styles.commentInput}
                  rows={3}
                  value={reportComment}
                  onChange={(e) => setReportComment(e.target.value)}
                  placeholder={t('student.menu.reportDetailsPlaceholder', 'Describe what happened (optional)')}
                />

                <p className={styles.reportHint}>
                  {t('student.menu.reportHint', 'Reports are reviewed automatically.')}
                </p>

                <button
                  type="button"
                  className={styles.addToCartButton}
                  onClick={() => {
                    void handleSubmitReport()
                  }}
                >
                  {t('student.menu.submitReport', 'Submit report')}
                </button>
              </>
            ) : (
              <>
                <p className={styles.reportConfirmation}>
                  {t('student.menu.reportSubmitted', 'Thank you. Your report has been submitted.')}
                </p>
                <button
                  type="button"
                  className={styles.addToCartButton}
                  onClick={() => setShowReportModal(false)}
                >
                  {t('student.menu.close', 'Close')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
