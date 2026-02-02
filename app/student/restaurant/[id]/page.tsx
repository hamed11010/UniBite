'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { mockRestaurants, mockMenu, Product } from '@/lib/mockData'
import styles from './menu.module.css'

export default function RestaurantMenuPage() {
  const router = useRouter()
  const params = useParams()
  const restaurantId = params.id as string

  const [restaurant, setRestaurant] = useState(
    mockRestaurants.find((r) => r.id === restaurantId)
  )
  const [isStudent, setIsStudent] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('Restaurant is closed')
  const [reportComment, setReportComment] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)
  interface SauceWithPrice {
    id: string
    name: string
    price: number
  }

  interface AddOnWithPrice {
    id: string
    name: string
    price: number
  }

  interface ExtendedProduct extends Product {
    sauces?: SauceWithPrice[]
    addOns?: AddOnWithPrice[]
    trackStock?: boolean
    stockQuantity?: number
    isOutOfStock?: boolean
  }

  const [menu, setMenu] = useState<ExtendedProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [comment, setComment] = useState('')
  const [selectedSauces, setSelectedSauces] = useState<string[]>([])
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = sessionStorage.getItem('isAuthenticated')
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      if (!isAuthenticated) {
        router.push('/auth/login')
        return
      }

      if (user && user.role === 'student') {
        setIsStudent(true)
      }

      // Try to load from restaurantMenu (from restaurant dashboard)
      const savedMenu = sessionStorage.getItem('restaurantMenu')
      if (savedMenu) {
        try {
          const categories = JSON.parse(savedMenu)
          // Flatten categories into products array
          const allProducts: ExtendedProduct[] = []
          categories.forEach((cat: any) => {
            cat.products.forEach((prod: any) => {
              allProducts.push({
                ...prod,
                category: cat.name,
              })
            })
          })
          if (allProducts.length > 0) {
            setMenu(allProducts)
            return
          }
        } catch (e) {
          // Fall back to mockMenu
        }
      }
    }

    // Fall back to mockMenu
    if (restaurantId && mockMenu[restaurantId]) {
      setMenu(mockMenu[restaurantId] as ExtendedProduct[])
    }
  }, [restaurantId, router])

  const isProductAvailable = (product: ExtendedProduct): boolean => {
    // Check if manually marked as out of stock
    if (product.isOutOfStock) return false
    // Check stock if tracking is enabled
    if (product.trackStock && product.stockQuantity !== undefined) {
      return product.stockQuantity > 0
    }
    // If not tracking stock and not manually out of stock, it's available
    return true
  }

  const handleProductClick = (product: ExtendedProduct) => {
    // Prevent opening modal for out-of-stock products
    if (!isProductAvailable(product)) return
    
    setSelectedProduct(product)
    setQuantity(1)
    setComment('')
    setSelectedSauces([])
    setSelectedAddOns([])
  }

  const handleAddToCart = () => {
    if (!selectedProduct) return

    // Calculate base price + add-ons
    let itemPrice = selectedProduct.price
    const selectedSauceNames: string[] = []
    const selectedAddOnNames: string[] = []
    
    if (selectedProduct.sauces) {
      selectedSauces.forEach(sauceId => {
        const sauce = selectedProduct.sauces?.find(s => s.id === sauceId)
        if (sauce) {
          itemPrice += sauce.price
          selectedSauceNames.push(sauce.name)
        }
      })
    } else if (selectedProduct.availableSauces) {
      // Legacy support
      selectedSauces.forEach(sauceId => {
        const sauceName = selectedProduct.availableSauces?.find(s => s === sauceId)
        if (sauceName) {
          selectedSauceNames.push(sauceName)
        }
      })
    }
    
    if (selectedProduct.addOns) {
      selectedAddOns.forEach(addOnId => {
        const addOn = selectedProduct.addOns?.find(a => a.id === addOnId)
        if (addOn) {
          itemPrice += addOn.price
          selectedAddOnNames.push(addOn.name)
        }
      })
    }

    const cartItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      price: itemPrice,
      quantity,
      comment: comment.trim() || undefined,
      sauces: selectedSauceNames.length > 0 ? selectedSauceNames : undefined,
      addOns: selectedAddOnNames.length > 0 ? selectedAddOnNames : undefined,
    }

    // Get existing cart from sessionStorage
    const existingCart = typeof window !== 'undefined' 
      ? JSON.parse(sessionStorage.getItem('cart') || '[]')
      : []

    // Add new item
    existingCart.push(cartItem)
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cart', JSON.stringify(existingCart))
    }

    // Close modal
    setSelectedProduct(null)
    setQuantity(1)
    setComment('')
    setSelectedSauces([])
    setSelectedAddOns([])
  }

  const toggleSauce = (sauceId: string) => {
    setSelectedSauces((prev) =>
      prev.includes(sauceId)
        ? prev.filter((s) => s !== sauceId)
        : [...prev, sauceId]
    )
  }

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId)
        ? prev.filter((a) => a !== addOnId)
        : [...prev, addOnId]
    )
  }

  const calculateTotal = () => {
    if (!selectedProduct) return 0
    let total = selectedProduct.price * quantity
    
    // Add sauce prices
    if (selectedProduct.sauces) {
      selectedSauces.forEach(sauceId => {
        const sauce = selectedProduct.sauces?.find(s => s.id === sauceId)
        if (sauce) {
          total += sauce.price * quantity
        }
      })
    } else if (selectedProduct.availableSauces) {
      // Legacy support - sauces are free
    }
    
    // Add add-on prices
    if (selectedProduct.addOns) {
      selectedAddOns.forEach(addOnId => {
        const addOn = selectedProduct.addOns?.find(a => a.id === addOnId)
        if (addOn) {
          total += addOn.price * quantity
        }
      })
    }
    
    return total
  }

  const handleSubmitReport = () => {
    if (typeof window === 'undefined' || !restaurant) return

    const existingReports = JSON.parse(sessionStorage.getItem('reports') || '[]')
    const newReport = {
      id: `report-${Date.now()}`,
      restaurantId,
      restaurantName: restaurant.name,
      reason: reportReason,
      comment: reportComment.trim() || undefined,
      status: 'new',
      createdAt: new Date().toISOString(),
    }

    existingReports.push(newReport)
    sessionStorage.setItem('reports', JSON.stringify(existingReports))
    setReportSubmitted(true)
  }

  // Group menu by category
  const menuByCategory = menu.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = []
    }
    acc[product.category].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  const cartCount = typeof window !== 'undefined'
    ? JSON.parse(sessionStorage.getItem('cart') || '[]').length
    : 0

  if (!restaurant) {
    return (
      <div className={styles.container}>
        <p>Restaurant not found</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
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
              Report an issue
            </button>
          )}
          <button
            onClick={() => router.push('/student/cart')}
            className={styles.cartButton}
          >
            Cart ({cartCount})
          </button>
        </div>
      </div>

      <div className={styles.menuContent}>
        {Object.entries(menuByCategory).map(([category, products]) => (
          <div key={category} className={styles.categorySection}>
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
                      <img
                        src={product.image}
                        alt={product.name}
                        className={styles.productImage}
                      />
                    ) : (
                      <div className={styles.productImagePlaceholder}>
                        📷
                      </div>
                    )}
                    <div className={styles.productInfo}>
                      <div className={styles.productHeader}>
                        <h3 className={styles.productName}>{product.name}</h3>
                        {!available && (
                          <span className={styles.outOfStockBadge}>Out of Stock</span>
                        )}
                      </div>
                      {product.description && (
                        <p className={styles.productDescription}>
                          {product.description}
                        </p>
                      )}
                      <p className={styles.productPrice}>{product.price} EGP</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setSelectedProduct(null)}
            >
              ×
            </button>
            <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
            <p className={styles.modalPrice}>{selectedProduct.price} EGP</p>

            <div className={styles.quantitySelector}>
              <label>Quantity</label>
              <div className={styles.quantityControls}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={styles.quantityButton}
                >
                  −
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
                <label>Sauces (optional)</label>
                <div className={styles.saucesList}>
                  {selectedProduct.sauces && selectedProduct.sauces.length > 0 ? (
                    selectedProduct.sauces.map((sauce) => (
                      <label key={sauce.id} className={styles.sauceOption}>
                        <input
                          type="checkbox"
                          checked={selectedSauces.includes(sauce.id)}
                          onChange={() => toggleSauce(sauce.id)}
                        />
                        <span>
                          {sauce.name} {sauce.price > 0 ? `(+${sauce.price} EGP)` : '(Free)'}
                        </span>
                      </label>
                    ))
                  ) : selectedProduct.availableSauces ? (
                    selectedProduct.availableSauces.map((sauce) => (
                      <label key={sauce} className={styles.sauceOption}>
                        <input
                          type="checkbox"
                          checked={selectedSauces.includes(sauce)}
                          onChange={() => toggleSauce(sauce)}
                        />
                        <span>{sauce} (Free)</span>
                      </label>
                    ))
                  ) : null}
                </div>
              </div>
            )}

            {selectedProduct.addOns && selectedProduct.addOns.length > 0 && (
              <div className={styles.saucesSection}>
                <label>Ingredients / Add-ons (optional)</label>
                <div className={styles.saucesList}>
                  {selectedProduct.addOns.map((addOn) => (
                    <label key={addOn.id} className={styles.sauceOption}>
                      <input
                        type="checkbox"
                        checked={selectedAddOns.includes(addOn.id)}
                        onChange={() => toggleAddOn(addOn.id)}
                      />
                      <span>
                        {addOn.name} {addOn.price > 0 ? `(+${addOn.price} EGP)` : '(Free)'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.commentSection}>
              <label htmlFor="comment">
                Any notes for the restaurant? (optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="E.g., No onions, extra cheese..."
                className={styles.commentInput}
                rows={3}
              />
            </div>

            <button
              onClick={handleAddToCart}
              className={styles.addToCartButton}
            >
              Add to Cart - {calculateTotal()} EGP
            </button>
          </div>
        </div>
      )}
      {/* Report Modal */}
      {showReportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReportModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setShowReportModal(false)}
            >
              ×
            </button>
            <h2 className={styles.modalTitle}>Report an issue</h2>
            {!reportSubmitted ? (
              <>
                <label className={styles.reportLabel}>Reason</label>
                <select
                  className={styles.reportSelect}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option>Restaurant is closed</option>
                  <option>Order accepted but not prepared</option>
                  <option>Restaurant says they don&apos;t use this app</option>
                  <option>Other issue</option>
                </select>

                <label className={styles.reportLabel}>
                  Additional details (optional)
                </label>
                <textarea
                  className={styles.commentInput}
                  rows={3}
                  value={reportComment}
                  onChange={(e) => setReportComment(e.target.value)}
                  placeholder="Describe what happened (optional)"
                />

                <p className={styles.reportHint}>
                  Reports are reviewed automatically in production (demo mode).
                </p>

                <button
                  type="button"
                  className={styles.addToCartButton}
                  onClick={handleSubmitReport}
                >
                  Submit report
                </button>
              </>
            ) : (
              <>
                <p className={styles.reportConfirmation}>
                  Thank you. Your report has been submitted.
                </p>
                <p className={styles.reportHint}>
                  Reports are reviewed automatically in production (demo mode).
                </p>
                <button
                  type="button"
                  className={styles.addToCartButton}
                  onClick={() => setShowReportModal(false)}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
