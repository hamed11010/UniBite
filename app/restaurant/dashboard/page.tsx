'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import type { Socket } from 'socket.io-client'
import { useLanguage } from '@/components/LanguageProvider'
import { checkAuth, hasRole } from '@/lib/auth'
import { logout } from '@/lib/api'
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchPendingOrdersCount,
  fetchUnhandledReportsCount,
  type Category as ApiCategory,
  type Product as ApiProduct,
  type ProductExtra,
} from '@/lib/api'
import { translate } from '@/lib/i18n'
import RestaurantOrdersView from '@/components/RestaurantOrdersView'
import NotificationBell from '@/components/NotificationBell'
import { createRealtimeSocket } from '@/lib/realtime'
import { APP_ROUTE } from '@/lib/redirectByRole'
import styles from './dashboard.module.css'

// Order interface â€” will be replaced by backend types in Phase 4
type ReportStatus = 'PENDING' | 'RESOLVED_BY_RESTAURANT' | 'CONFIRMED_BY_STUDENT' | 'ESCALATED'

interface ReportItem {
  id: string
  type: string
  status: ReportStatus
  comment?: string
  createdAt: string
  updatedAt: string
}

interface Sauce {
  id: string
  name: string
  price: number
}

interface AddOn {
  id: string
  name: string
  price: number
}

interface Product {
  id: string
  name: string
  price: number
  description: string
  hasSauces: boolean
  sauces?: Sauce[]
  addOns?: AddOn[]
  trackStock?: boolean
  stockQuantity?: number
  stockThreshold?: number
  isOutOfStock?: boolean
}

interface Category {
  id: string
  name: string
  products: Product[]
}

function parseTimeToMinutes(time?: string | null) {
  if (!time) return null
  const [hoursRaw, minutesRaw] = time.split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  return hours * 60 + minutes
}

function hasOpenTimePassed(openTime?: string | null) {
  const openMinutes = parseTimeToMinutes(openTime)
  if (openMinutes === null) {
    return false
  }

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return nowMinutes >= openMinutes
}

function formatReportLabel(value: string, messages: Record<string, string>) {
  return translate(messages, `status.${value}`, value.replace(/_/g, ' '))
}

export default function RestaurantDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { messages } = useLanguage()
  const t = useCallback(
    (key: string, fallback: string) => translate(messages, key, fallback),
    [messages],
  )
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'reports' | 'settings'>('orders')
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [reports, setReports] = useState<ReportItem[]>([])
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const [unhandledReportsCount, setUnhandledReportsCount] = useState(0)
  const [showOpenReminderBanner, setShowOpenReminderBanner] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [ordersRealtimeToken, setOrdersRealtimeToken] = useState(0)

  const initialOrdersView = searchParams.get('ordersView') === 'today' ? 'today' : 'incoming'

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/reports/restaurant`,
        { credentials: 'include' },
      )
      if (!res.ok) {
        throw new Error(t('restaurant.reports.errorFetch', 'Failed to fetch reports'))
      }
      const data: unknown = await res.json()
      if (!Array.isArray(data)) {
        setReports([])
        return
      }
      const normalizedReports = data.filter(
        (item): item is ReportItem =>
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          'type' in item &&
          'status' in item &&
          'createdAt' in item &&
          'updatedAt' in item,
      )
      setReports(normalizedReports)
    } catch (error) {
      console.error('Failed to fetch reports', error)
      setReports([])
    }
  }, [t])

  const fetchNotificationCounts = useCallback(async () => {
    if (!restaurantId) return

    try {
      const [pendingOrdersResult, unhandledReportsResult] = await Promise.all([
        fetchPendingOrdersCount(restaurantId),
        fetchUnhandledReportsCount(restaurantId),
      ])

      setPendingOrdersCount(pendingOrdersResult.pendingOrders ?? 0)
      setUnhandledReportsCount(unhandledReportsResult.unhandledReports ?? 0)
    } catch (error) {
      console.error('Failed to fetch notification counts', error)
    }
  }, [restaurantId])

  const refreshOpenReminderBanner = useCallback(async () => {
    if (!restaurantId) return

    try {
      const [settingsRes, configRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/restaurant/${restaurantId}/settings`,
          { credentials: 'include' },
        ),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/config`, {
          credentials: 'include',
        }),
      ])

      if (!settingsRes.ok || !configRes.ok) {
        setShowOpenReminderBanner(false)
        return
      }

      const settings = await settingsRes.json()
      const config = await configRes.json()

      const shouldShowBanner =
        !settings.isOpen &&
        hasOpenTimePassed(settings.openTime) &&
        !settings.isDisabled &&
        settings.isUniversityActive &&
        !config.maintenanceMode

      setShowOpenReminderBanner(Boolean(shouldShowBanner))
    } catch (error) {
      console.error('Failed to refresh open reminder banner', error)
      setShowOpenReminderBanner(false)
    }
  }, [restaurantId])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const verifyAuth = async () => {
      const user = await checkAuth()

      if (!user || !hasRole(user, 'RESTAURANT_ADMIN')) {
        router.push('/auth/login')
        return
      }

      if (user.restaurantId) {
        setRestaurantId(user.restaurantId)
        await fetchReports()
      }
    }

    void verifyAuth()
  }, [router, fetchReports])

  useEffect(() => {
    if (!restaurantId || typeof window === 'undefined') return

    // Polling keeps counts/reports fresh even if websocket delivery is delayed.
    void fetchNotificationCounts()
    void refreshOpenReminderBanner()
    void fetchReports()

    const interval = window.setInterval(() => {
      void fetchNotificationCounts()
      void refreshOpenReminderBanner()
      void fetchReports()
    }, 15000)

    const handleFocus = () => {
      void fetchNotificationCounts()
      void refreshOpenReminderBanner()
      void fetchReports()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [restaurantId, fetchNotificationCounts, refreshOpenReminderBanner, fetchReports])

  useEffect(() => {
    if (!restaurantId) return

    // Realtime events provide low-latency updates; polling above remains the fallback path.
    const realtimeSocket = createRealtimeSocket()
    setSocket(realtimeSocket)

    const refreshOrdersRealtime = () => {
      setOrdersRealtimeToken((prev) => prev + 1)
      void fetchNotificationCounts()
    }

    const refreshReportsRealtime = () => {
      void fetchReports()
      void fetchNotificationCounts()
    }

    realtimeSocket.on('order:new', refreshOrdersRealtime)
    realtimeSocket.on('order:statusChanged', refreshOrdersRealtime)
    realtimeSocket.on('notification:new', refreshReportsRealtime)

    return () => {
      realtimeSocket.off('order:new', refreshOrdersRealtime)
      realtimeSocket.off('order:statusChanged', refreshOrdersRealtime)
      realtimeSocket.off('notification:new', refreshReportsRealtime)
      realtimeSocket.disconnect()
      setSocket(null)
    }
  }, [restaurantId, fetchNotificationCounts, fetchReports])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'orders' || tab === 'menu' || tab === 'reports' || tab === 'settings') {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    router.push(APP_ROUTE.ROOT)
  }

  const handleOrderStatusUpdated = useCallback(async () => {
    await fetchNotificationCounts()
  }, [fetchNotificationCounts])

  const handleResolveReport = useCallback(
    async (reportId: string) => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/reports/${reportId}/resolve`,
          {
            method: 'PATCH',
            credentials: 'include',
          },
        )

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || t('restaurant.reports.errorResolve', 'Failed to mark report as handled'))
        }

        const Swal = (await import('sweetalert2')).default
        await Swal.fire({
          icon: 'success',
          title: t('restaurant.dashboard.reportHandled', 'Report marked handled'),
          timer: 1400,
          showConfirmButton: false,
        })

        await fetchReports()
        await fetchNotificationCounts()
      } catch (error: any) {
        const Swal = (await import('sweetalert2')).default
        await Swal.fire({
          icon: 'error',
          title: t('restaurant.dashboard.errorUpdateReport', 'Failed to update report'),
          text: error?.message || t('common.tryAgain', 'Please try again.'),
        })
      }
    },
    [fetchReports, fetchNotificationCounts, t],
  )

  const escalatedReportsCount = reports.filter((report) => report.status === 'ESCALATED').length

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('restaurant.dashboard.title', 'Restaurant Dashboard')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationBell socket={socket} />
          <button onClick={handleLogout} className={styles.logoutButton}>
            {t('sidebar.logout', 'Logout')}
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <span className={styles.tabLabel}>
            {t('restaurant.dashboard.ordersTab', 'Orders')}
            <span className={pendingOrdersCount > 0 ? styles.badge : styles.badgeHidden}>
              {pendingOrdersCount}
            </span>
          </span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'menu' ? styles.active : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          {t('restaurant.dashboard.menuTab', 'Menu Management')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'reports' ? styles.active : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <span className={styles.tabLabel}>
            {t('restaurant.dashboard.reportsTab', 'Reports')}
            <span className={unhandledReportsCount > 0 ? styles.badge : styles.badgeHidden}>
              {unhandledReportsCount}
            </span>
          </span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          {t('restaurant.dashboard.settingsTab', 'Settings')}
        </button>
      </div>

      {showOpenReminderBanner && (
        <div className={styles.openReminderBanner}>
          {t('restaurant.dashboard.openReminder', 'Opening time has passed. Please mark your restaurant as open.')}
        </div>
      )}

      {escalatedReportsCount > 0 && (
        <div className={styles.openReminderBanner}>
          {t(
            'restaurant.dashboard.escalatedAlert',
            'You have escalated reports that require super admin review.',
          )}{' '}
          ({escalatedReportsCount})
        </div>
      )}

      <div className={styles.content}>
        {activeTab === 'orders' && (
          restaurantId ? (
            <RestaurantOrdersView
              restaurantId={restaurantId}
              initialSubTab={initialOrdersView}
              onOrderStatusUpdated={handleOrderStatusUpdated}
              externalRefreshToken={ordersRealtimeToken}
            />
          ) : (
            <p className={styles.emptyMessage}>{t('restaurant.dashboard.restaurantNotFound', 'Restaurant not found')}</p>
          )
        )}
        {activeTab === 'menu' && <MenuTab />}
        {activeTab === 'reports' && (
          <ReportsTab reports={reports} onResolveReport={handleResolveReport} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab onAvailabilityChanged={() => void refreshOpenReminderBanner()} />
        )}
      </div>
    </div>
  )
}

function ReportsTab({
  reports,
  onResolveReport,
}: {
  reports: ReportItem[]
  onResolveReport: (reportId: string) => Promise<void>
}) {
  const { messages } = useLanguage()
  const t = useCallback(
    (key: string, fallback: string) => translate(messages, key, fallback),
    [messages],
  )

  return (
    <div className={styles.ordersTab}>
      <h2 className={styles.sectionTitle}>
        {t('restaurant.reports.title', 'Reports for this restaurant')}
      </h2>
      <p className={styles.infoText}>
        {t(
          'restaurant.reports.info',
          'Trust and safety reports are listed here for restaurant action.',
        )}
      </p>
      {reports.length === 0 ? (
        <p className={styles.emptyMessage}>
          {t('restaurant.reports.empty', 'No reports submitted yet.')}
        </p>
      ) : (
        <div className={styles.ordersList}>
          {reports.map((report) => (
            <div key={report.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <p className={styles.orderId}>{formatReportLabel(report.type, messages)}</p>
                  <p className={styles.orderTime}>
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    report.status === 'ESCALATED' ? styles.cancelled : styles.received
                  }`}
                >
                  {formatReportLabel(report.status, messages)}
                </span>
              </div>
              {report.comment && (
                <p className={styles.itemComment}>{report.comment}</p>
              )}
              {report.status === 'PENDING' && (
                <button
                  type="button"
                  className={styles.reportActionButton}
                  onClick={() => void onResolveReport(report.id)}
                >
                  {t('restaurant.reports.markHandled', 'Mark Handled')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MenuTab() {
  const { messages } = useLanguage()
  const t = useCallback(
    (key: string, fallback: string) => translate(messages, key, fallback),
    [messages],
  )
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<{ categoryId: string; product: Product } | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    hasSauces: false,
    sauces: [] as Sauce[],
    addOns: [] as AddOn[],
    trackStock: false,
    stockQuantity: 0,
    stockThreshold: 0,
    isOutOfStock: false,
  })

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch categories and products
      const [categoriesData, productsData] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
      ])

      // Group products by category
      const categoriesMap = new Map<string, Category>()

      categoriesData.forEach((cat: ApiCategory) => {
        categoriesMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          products: [],
        })
      })

      productsData.forEach((prod: ApiProduct) => {
        const category = categoriesMap.get(prod.categoryId)
        if (category) {
          // Convert extras to sauces/addOns format for UI
          const extras = prod.extras || []
          const hasExtras = extras.length > 0

          category.products.push({
            id: prod.id,
            name: prod.name,
            price: prod.price,
            description: prod.description || '',
            hasSauces: hasExtras,
            sauces: hasExtras ? extras.map((e: ProductExtra) => ({
              id: e.id,
              name: e.name,
              price: e.price,
            })) : [],
            addOns: [],
            trackStock: prod.hasStock,
            stockQuantity: prod.stockQuantity || undefined,
            stockThreshold: prod.stockThreshold || undefined,
            isOutOfStock: prod.manuallyOutOfStock,
          })
        }
      })

      setCategories(Array.from(categoriesMap.values()))
    } catch (err: any) {
      setError(err.message || t('restaurant.menu.errorLoad', 'Failed to load menu'))
    } finally {
      setLoading(false)
    }
  }, [t])

  // Load menu from backend
  useEffect(() => {
    void loadMenu()
  }, [loadMenu])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError(t('restaurant.menu.validationCategoryName', 'Category name is required'))
      return
    }

    try {
      setError(null)
      await createCategory(newCategoryName.trim())
      setNewCategoryName('')
      setShowAddCategory(false)
      await loadMenu()
    } catch (err: any) {
      setError(err.message || t('restaurant.menu.errorCreateCategory', 'Failed to create category'))
    }
  }

  const handleAddProduct = async (categoryId: string) => {
    if (!newProduct.name.trim() || !newProduct.price) {
      setError(t('restaurant.menu.validationProductNamePrice', 'Product name and price are required'))
      return
    }

    try {
      setError(null)

      // Combine sauces and addOns into extras
      const extras = [
        ...(newProduct.sauces || []).map(s => ({ name: s.name, price: s.price })),
        ...(newProduct.addOns || []).map(a => ({ name: a.name, price: a.price })),
      ]

      await createProduct({
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        description: newProduct.description || undefined,
        hasStock: newProduct.trackStock,
        stockQuantity: newProduct.trackStock ? newProduct.stockQuantity : undefined,
        stockThreshold: newProduct.trackStock ? newProduct.stockThreshold : undefined,
        manuallyOutOfStock: newProduct.isOutOfStock,
        categoryId,
        extras: extras.length > 0 ? extras : undefined,
      })

      setNewProduct({
        name: '',
        price: '',
        description: '',
        hasSauces: false,
        sauces: [],
        addOns: [],
        trackStock: false,
        stockQuantity: 0,
        stockThreshold: 0,
        isOutOfStock: false,
      })
      setShowAddProduct(null)
      await loadMenu()
    } catch (err: any) {
      setError(err.message || t('restaurant.menu.errorCreateProduct', 'Failed to create product'))
    }
  }

  const handleEditProduct = (categoryId: string, product: Product) => {
    setEditingProduct({ categoryId, product })
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      hasSauces: product.hasSauces,
      sauces: product.sauces || [],
      addOns: product.addOns || [],
      trackStock: product.trackStock || false,
      stockQuantity: product.stockQuantity || 0,
      stockThreshold: product.stockThreshold || 0,
      isOutOfStock: product.isOutOfStock || false,
    })
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct || !newProduct.name.trim() || !newProduct.price) {
      setError(t('restaurant.menu.validationProductNamePrice', 'Product name and price are required'))
      return
    }

    try {
      setError(null)

      // Combine sauces and addOns into extras
      const extras = [
        ...(newProduct.sauces || []).map(s => ({ name: s.name, price: s.price })),
        ...(newProduct.addOns || []).map(a => ({ name: a.name, price: a.price })),
      ]

      await updateProduct(editingProduct.product.id, {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        description: newProduct.description || undefined,
        hasStock: newProduct.trackStock,
        stockQuantity: newProduct.trackStock ? newProduct.stockQuantity : undefined,
        stockThreshold: newProduct.trackStock ? newProduct.stockThreshold : undefined,
        manuallyOutOfStock: newProduct.isOutOfStock,
        categoryId: editingProduct.categoryId,
        extras: extras.length > 0 ? extras : [],
      })

      setEditingProduct(null)
      setNewProduct({
        name: '',
        price: '',
        description: '',
        hasSauces: false,
        sauces: [],
        addOns: [],
        trackStock: false,
        stockQuantity: 0,
        stockThreshold: 0,
        isOutOfStock: false,
      })
      await loadMenu()
    } catch (err: any) {
      setError(err.message || t('restaurant.menu.errorUpdateProduct', 'Failed to update product'))
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    const Swal = (await import('sweetalert2')).default
    const result = await Swal.fire({
      title: t('restaurant.menu.deleteTitle', 'Delete Product?'),
      text: t('restaurant.menu.deleteText', 'This action cannot be undone.'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('restaurant.menu.deleteConfirm', 'Delete'),
      cancelButtonText: t('restaurant.menu.cancel', 'Cancel'),
      confirmButtonColor: '#d32f2f',
    })

    if (!result.isConfirmed) return

    try {
      setError(null)
      await deleteProduct(productId)
      await loadMenu()
    } catch (err: any) {
      setError(err.message || t('restaurant.menu.errorDeleteProduct', 'Failed to delete product'))
      Swal.fire(
        t('common.error', 'Error'),
        err.message || t('restaurant.menu.errorDeleteProduct', 'Failed to delete product'),
        'error',
      )
    }
  }

  const addSauce = () => {
    const newSauce: Sauce = {
      id: `sauce${Date.now()}`,
      name: '',
      price: 0,
    }
    setNewProduct({
      ...newProduct,
      sauces: [...(newProduct.sauces || []), newSauce],
    })
  }

  const updateSauce = (sauceId: string, field: 'name' | 'price', value: string | number) => {
    setNewProduct({
      ...newProduct,
      sauces: (newProduct.sauces || []).map(s =>
        s.id === sauceId ? { ...s, [field]: value } : s
      ),
    })
  }

  const removeSauce = (sauceId: string) => {
    setNewProduct({
      ...newProduct,
      sauces: (newProduct.sauces || []).filter(s => s.id !== sauceId),
    })
  }

  const addAddOn = () => {
    const newAddOn: AddOn = {
      id: `addon${Date.now()}`,
      name: '',
      price: 0,
    }
    setNewProduct({
      ...newProduct,
      addOns: [...(newProduct.addOns || []), newAddOn],
    })
  }

  const updateAddOn = (addOnId: string, field: 'name' | 'price', value: string | number) => {
    setNewProduct({
      ...newProduct,
      addOns: (newProduct.addOns || []).map(a =>
        a.id === addOnId ? { ...a, [field]: value } : a
      ),
    })
  }

  const removeAddOn = (addOnId: string) => {
    setNewProduct({
      ...newProduct,
      addOns: (newProduct.addOns || []).filter(a => a.id !== addOnId),
    })
  }

  if (loading) {
    return (
      <div className={styles.menuTab}>
        <p>{t('restaurant.menu.loading', 'Loading menu...')}</p>
      </div>
    )
  }

  return (
    <div className={styles.menuTab}>
      <div className={styles.menuHeader}>
        <h2 className={styles.sectionTitle}>
          {translate(messages, 'restaurant.dashboard.menuTab', 'Menu Management')}
        </h2>
        <button
          onClick={() => setShowAddCategory(true)}
          className={styles.addCategoryButton}
        >
          {t('restaurant.menu.addCategoryCta', '+ Add Category')}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {showAddCategory && (
        <div className={styles.addForm}>
          <input
            type="text"
            placeholder={t('restaurant.menu.categoryPlaceholder', 'Category name (e.g., Sandwiches, Drinks)')}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className={styles.input}
          />
          <div className={styles.formActions}>
            <button onClick={handleAddCategory} className={styles.saveButton}>
              {t('restaurant.menu.addCategory', 'Add Category')}
            </button>
            <button
              onClick={() => {
                setShowAddCategory(false)
                setNewCategoryName('')
              }}
              className={styles.cancelButton}
            >
              {t('restaurant.menu.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      )}

      <div className={styles.categoriesList}>
        {categories.map((category) => (
          <div key={category.id} className={styles.categoryCard}>
            <div className={styles.categoryHeader}>
              <h3 className={styles.categoryName}>{category.name}</h3>
              <button
                onClick={() => setShowAddProduct(showAddProduct === category.id ? null : category.id)}
                className={styles.addProductButton}
              >
                {t('restaurant.menu.addProductCta', '+ Add Product')}
              </button>
            </div>

            {(showAddProduct === category.id || editingProduct?.categoryId === category.id) && (
              <div className={styles.productForm}>
                <input
                  type="text"
                  placeholder={t('restaurant.menu.productNamePlaceholder', 'Product name')}
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder={t('restaurant.menu.basePricePlaceholder', 'Base price (EGP)')}
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className={styles.input}
                />
                <textarea
                  placeholder={t('restaurant.menu.descriptionPlaceholder', 'Description (optional)')}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className={styles.textarea}
                  rows={2}
                />
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={newProduct.hasSauces}
                    onChange={(e) => setNewProduct({ ...newProduct, hasSauces: e.target.checked })}
                  />
                  <span>{t('restaurant.menu.allowExtras', 'Allow sauces/extras')}</span>
                </label>

                {newProduct.hasSauces && (
                  <div className={styles.extrasSection}>
                    <div className={styles.extrasHeader}>
                      <h4>{t('restaurant.menu.saucesTitle', 'Sauces (Extras)')}</h4>
                      <button onClick={addSauce} className={styles.addExtraButton}>
                        {t('restaurant.menu.addSauce', '+ Add Sauce')}
                      </button>
                    </div>
                    {newProduct.sauces && newProduct.sauces.map((sauce) => (
                      <div key={sauce.id} className={styles.extraItem}>
                        <input
                          type="text"
                          placeholder={t('restaurant.menu.sauceNamePlaceholder', 'Sauce name')}
                          value={sauce.name}
                          onChange={(e) => updateSauce(sauce.id, 'name', e.target.value)}
                          className={styles.input}
                        />
                        <input
                          type="number"
                          placeholder={t('restaurant.menu.extraPricePlaceholder', 'Price (0 = free)')}
                          value={sauce.price}
                          onChange={(e) => updateSauce(sauce.id, 'price', parseFloat(e.target.value) || 0)}
                          className={styles.input}
                          min="0"
                          step="0.5"
                        />
                        <button onClick={() => removeSauce(sauce.id)} className={styles.removeExtraButton}>x</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.extrasSection}>
                  <div className={styles.extrasHeader}>
                    <h4>{t('restaurant.menu.ingredientsTitle', 'Ingredients / Add-ons')}</h4>
                    <button onClick={addAddOn} className={styles.addExtraButton}>
                      {t('restaurant.menu.addIngredient', '+ Add Ingredient')}
                    </button>
                  </div>
                  {newProduct.addOns && newProduct.addOns.map((addOn) => (
                    <div key={addOn.id} className={styles.extraItem}>
                      <input
                        type="text"
                        placeholder={t('restaurant.menu.ingredientNamePlaceholder', 'Ingredient name')}
                        value={addOn.name}
                        onChange={(e) => updateAddOn(addOn.id, 'name', e.target.value)}
                        className={styles.input}
                      />
                      <input
                        type="number"
                        placeholder={t('restaurant.menu.extraPricePlaceholder', 'Price (0 = free)')}
                        value={addOn.price}
                        onChange={(e) => updateAddOn(addOn.id, 'price', parseFloat(e.target.value) || 0)}
                        className={styles.input}
                        min="0"
                        step="0.5"
                      />
                      <button onClick={() => removeAddOn(addOn.id)} className={styles.removeExtraButton}>x</button>
                    </div>
                  ))}
                </div>

                <div className={styles.stockSection}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newProduct.trackStock}
                      onChange={(e) => setNewProduct({ ...newProduct, trackStock: e.target.checked, stockQuantity: e.target.checked ? newProduct.stockQuantity : 0, stockThreshold: e.target.checked ? newProduct.stockThreshold : 0 })}
                    />
                    <span>{t('restaurant.menu.trackStock', 'Track stock for this product')}</span>
                  </label>
                  {newProduct.trackStock && (
                    <>
                      <div className={styles.stockInput}>
                        <label className={styles.settingLabel}>
                          {t('restaurant.menu.stockQuantityLabel', 'Stock Quantity (Internal Only)')}
                        </label>
                        <input
                          type="number"
                          placeholder={t('restaurant.menu.stockQuantityPlaceholder', 'Stock quantity')}
                          value={newProduct.stockQuantity}
                          onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: parseInt(e.target.value) || 0 })}
                          className={styles.input}
                          min="0"
                        />
                      </div>
                      <div className={styles.stockInput}>
                        <label className={styles.settingLabel}>
                          {t(
                            'restaurant.menu.stockThresholdLabel',
                            'Stock Threshold (Out of stock when quantity <= threshold)',
                          )}
                        </label>
                        <input
                          type="number"
                          placeholder={t('restaurant.menu.stockThresholdPlaceholder', 'Stock threshold')}
                          value={newProduct.stockThreshold}
                          onChange={(e) => setNewProduct({ ...newProduct, stockThreshold: parseInt(e.target.value) || 0 })}
                          className={styles.input}
                          min="0"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className={styles.stockSection}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newProduct.isOutOfStock}
                      onChange={(e) => setNewProduct({ ...newProduct, isOutOfStock: e.target.checked })}
                    />
                    <span>{t('restaurant.menu.markOutOfStock', 'Mark as Out of Stock')}</span>
                  </label>
                  <p className={styles.overrideNote}>{t('restaurant.menu.manualOverride', 'Manual override')}</p>
                </div>

                <div className={styles.formActions}>
                  <button
                    onClick={() => editingProduct ? handleUpdateProduct() : handleAddProduct(category.id)}
                    className={styles.saveButton}
                  >
                    {editingProduct
                      ? t('restaurant.menu.updateProduct', 'Update Product')
                      : t('restaurant.menu.addProduct', 'Add Product')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddProduct(null)
                      setEditingProduct(null)
                      setNewProduct({ name: '', price: '', description: '', hasSauces: false, sauces: [], addOns: [], trackStock: false, stockQuantity: 0, stockThreshold: 0, isOutOfStock: false })
                    }}
                    className={styles.cancelButton}
                  >
                    {t('restaurant.menu.cancel', 'Cancel')}
                  </button>
                </div>
              </div>
            )}

            <div className={styles.productsList}>
              {category.products.map((product) => {
                // Calculate availability based on stock rules
                let isAvailable = !product.isOutOfStock
                if (isAvailable && product.trackStock && product.stockQuantity !== undefined && product.stockThreshold !== undefined) {
                  isAvailable = product.stockQuantity > product.stockThreshold
                }
                return (
                  <div key={product.id} className={`${styles.productCard} ${!isAvailable ? styles.outOfStock : ''}`}>
                    <div className={styles.productImagePlaceholder}>
                      <Image
                        src="/logo-icon.svg"
                        alt=""
                        className={styles.placeholderLogo}
                        width={44}
                        height={44}
                        aria-hidden="true"
                      />
                    </div>
                    <div className={styles.productDetails}>
                      <div className={styles.productHeader}>
                        <h4 className={styles.productName}>{product.name}</h4>
                        <span className={`${styles.availabilityBadge} ${isAvailable ? styles.available : styles.unavailable}`}>
                          {isAvailable ? t('restaurant.menu.available', 'Available') : t('restaurant.menu.outOfStock', 'Out of Stock')}
                        </span>
                      </div>
                      {product.description && (
                        <p className={styles.productDescription}>{product.description}</p>
                      )}
                      <p className={styles.productPrice}>{product.price} EGP</p>
                      {product.hasSauces && (
                        <span className={styles.sauceBadge}>
                          {t('restaurant.menu.saucesAvailable', 'Sauces available')}
                        </span>
                      )}
                      {product.trackStock && product.stockQuantity !== undefined && (
                        <p className={styles.stockInfo}>
                          {t('restaurant.menu.stock', 'Stock')}: {product.stockQuantity}
                          {product.stockThreshold !== undefined &&
                            ` (${t('restaurant.menu.threshold', 'Threshold')}: ${product.stockThreshold})`}
                          {' '}
                          {t('restaurant.menu.internalOnly', '(Internal)')}
                        </p>
                      )}
                    </div>
                    <div className={styles.productActions}>
                      <button
                        onClick={() => handleEditProduct(category.id, product)}
                        className={styles.editButton}
                      >
                        {t('restaurant.menu.edit', 'Edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className={styles.deleteButton}
                      >
                        {t('restaurant.menu.delete', 'Delete')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
function SettingsTab({
  onAvailabilityChanged,
}: {
  onAvailabilityChanged?: () => void | Promise<void>
}) {
  const { messages } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('22:00')
  const [maxConcurrentOrders, setMaxConcurrentOrders] = useState(0)
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [updatingAvailability, setUpdatingAvailability] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = await checkAuth()
        if (!user?.restaurantId) return

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/restaurant/${user.restaurantId}/settings`,
          { credentials: 'include' },
        )

        if (!res.ok) {
          throw new Error(
            translate(messages, 'restaurant.settings.errorLoad', 'Failed to load settings'),
          )
        }

        const data = await res.json()
        setIsOpen(data.isOpen ?? false)
        setOpenTime(data.openTime ?? '08:00')
        setCloseTime(data.closeTime ?? '22:00')
        setMaxConcurrentOrders(data.maxConcurrentOrders ?? 0)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    void loadSettings()
  }, [messages])

  const saveSettings = async () => {
    if (savingSettings || updatingAvailability) return
    setSavingSettings(true)

    try {
      const user = await checkAuth()
      if (!user?.restaurantId) return

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/restaurant/${user.restaurantId}/settings`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ openTime, closeTime, maxConcurrentOrders }),
        },
      )

      if (!res.ok) {
        throw new Error(translate(messages, 'restaurant.settings.errorSave', 'Failed to save'))
      }
      const data = await res.json()
      setOpenTime(data.openTime ?? openTime)
      setCloseTime(data.closeTime ?? closeTime)
      setMaxConcurrentOrders(data.maxConcurrentOrders ?? maxConcurrentOrders)
      setIsOpen(data.isOpen ?? isOpen)
      if (onAvailabilityChanged) {
        await onAvailabilityChanged()
      }

      const Swal = (await import('sweetalert2')).default
      Swal.fire({
        icon: 'success',
        title: translate(messages, 'restaurant.settings.workingHoursUpdated', 'Working hours updated'),
        timer: 1500,
        showConfirmButton: false,
      })
    } catch {
      const Swal = (await import('sweetalert2')).default
      Swal.fire({
        icon: 'error',
        title: translate(messages, 'restaurant.settings.errorSaveSettings', 'Failed to save settings'),
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const toggleOpen = async () => {
    if (savingSettings || updatingAvailability) return
    setUpdatingAvailability(true)
    const nextIsOpen = !isOpen

    try {
      const user = await checkAuth()
      if (!user?.restaurantId) return

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'}/restaurant/${user.restaurantId}/settings`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isOpen: nextIsOpen }),
        },
      )

      if (!res.ok) {
        throw new Error(
          translate(messages, 'restaurant.settings.errorUpdateStatus', 'Failed to update restaurant status'),
        )
      }
      const data = await res.json()
      setIsOpen(data.isOpen ?? nextIsOpen)
      setOpenTime(data.openTime ?? openTime)
      setCloseTime(data.closeTime ?? closeTime)
      setMaxConcurrentOrders(data.maxConcurrentOrders ?? maxConcurrentOrders)
      if (onAvailabilityChanged) {
        await onAvailabilityChanged()
      }

      const Swal = (await import('sweetalert2')).default
      Swal.fire({
        icon: 'success',
        title: nextIsOpen
          ? translate(messages, 'restaurant.settings.restaurantOpened', 'Restaurant opened')
          : translate(messages, 'restaurant.settings.restaurantClosed', 'Restaurant closed'),
        timer: 1500,
        showConfirmButton: false,
      })
    } catch {
      const Swal = (await import('sweetalert2')).default
      Swal.fire({
        icon: 'error',
        title: translate(messages, 'restaurant.settings.errorUpdateStatus', 'Failed to update restaurant status'),
      })
    } finally {
      setUpdatingAvailability(false)
    }
  }

  if (loading) {
    return <p>{translate(messages, 'restaurant.settings.loading', 'Loading settings...')}</p>
  }

  return (
    <div className={styles.settingsTab}>
      <h2 className={styles.sectionTitle}>
        {translate(messages, 'restaurant.settings.title', 'Restaurant Settings')}
      </h2>

      <div className={styles.settingsCard}>
        <h3 className={styles.settingsCardTitle}>
          {translate(messages, 'restaurant.settings.manualAvailability', 'Manual Availability')}
        </h3>
        <p className={styles.infoText}>
          {translate(
            messages,
            'restaurant.settings.manualAvailabilityInfo',
            'You can manually open or close your restaurant at any time.',
          )}
        </p>

        <div className={styles.availabilityRow}>
          <span
            className={`${styles.manualAvailabilityBadge} ${isOpen ? styles.availabilityOpen : styles.availabilityClosed}`}
          >
            {isOpen
              ? translate(messages, 'restaurant.settings.open', 'OPEN')
              : translate(messages, 'restaurant.settings.closed', 'CLOSED')}
          </span>
          <button
            type="button"
            className={`${styles.manualAvailabilityToggle} ${isOpen ? styles.manualAvailabilityToggleOpen : styles.manualAvailabilityToggleClosed}`}
            onClick={() => void toggleOpen()}
            disabled={updatingAvailability || savingSettings}
            aria-label={translate(messages, 'restaurant.settings.toggleAvailability', 'Toggle restaurant availability')}
          >
            <span className={styles.manualAvailabilityToggleKnob} />
          </button>
        </div>

        <p className={styles.settingsHint}>
          {updatingAvailability
            ? translate(messages, 'restaurant.settings.updatingAvailability', 'Updating availability...')
            : translate(
                messages,
                'restaurant.settings.availabilityApplied',
                'Manual availability is applied immediately.',
              )}
        </p>
      </div>

      <div className={styles.settingsCard}>
        <h3 className={styles.settingsCardTitle}>
          {translate(messages, 'restaurant.settings.workingHours', 'Working Hours')}
        </h3>
        <p className={styles.infoText}>
          {translate(
            messages,
            'restaurant.settings.workingHoursInfo',
            'Restaurant automatically closes when closing time is reached.',
          )}
        </p>

        <label className={styles.settingsFieldLabel}>
          {translate(messages, 'restaurant.settings.openingTime', 'Opening Time')}
        </label>
        <input
          type="time"
          value={openTime}
          onChange={(e) => setOpenTime(e.target.value)}
          className={styles.timeInput}
        />

        <label className={styles.settingsFieldLabel}>
          {translate(messages, 'restaurant.settings.closingTime', 'Closing Time')}
        </label>
        <input
          type="time"
          value={closeTime}
          onChange={(e) => setCloseTime(e.target.value)}
          className={styles.timeInput}
        />

        <label className={styles.settingsFieldLabel}>
          {translate(
            messages,
            'restaurant.settings.maxConcurrentOrders',
            'Max Concurrent Orders (0 = unlimited)',
          )}
        </label>
        <input
          type="number"
          min={0}
          value={maxConcurrentOrders}
          onChange={(e) => setMaxConcurrentOrders(parseInt(e.target.value) || 0)}
          className={styles.timeInput}
        />

        <button
          className={styles.saveButton}
          onClick={() => void saveSettings()}
          disabled={savingSettings || updatingAvailability}
        >
          {savingSettings
            ? translate(messages, 'common.saving', 'Saving...')
            : translate(messages, 'restaurant.settings.saveWorkingHours', 'Save Working Hours')}
        </button>
      </div>
    </div>
  )
}




