'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { useLanguage } from '@/components/LanguageProvider'
import { checkAuth } from '@/lib/auth'
import { translate } from '@/lib/i18n'
import {
  mapRestaurantOrderStatuses,
  type OrderStatusFilter,
  type RestaurantOrdersSubTab,
} from '@/lib/orderFilters'
import { ORDER_STATUS_FILTER, type OrderStatus } from '@/lib/status'
import styles from '@/app/restaurant/dashboard/dashboard.module.css'

type OrdersSubTab = RestaurantOrdersSubTab
type UiOrderStatus =
  | 'received'
  | 'preparing'
  | 'ready'
  | 'delivered_to_student'
  | 'completed'
  | 'cancelled'
type FilterStatus = OrderStatusFilter
type CancellationReasonType = 'OUT_OF_STOCK' | 'INTERNAL_ISSUE' | 'BUSY' | 'OTHER'

interface ApiOrderItem {
  productId: string
  quantity: number
  priceSnapshot: number
  comment?: string
  extrasSnapshot?: Array<{ name: string }>
  product: {
    name: string
  }
}

interface ApiOrder {
  id: string
  orderNumber: number
  restaurantId: string
  posOrderNumber?: string | null
  status: OrderStatus
  total: number
  createdAt: string
  items: ApiOrderItem[]
}

interface Order {
  id: string
  orderNumber: number
  restaurantId: string
  posOrderNumber?: string | null
  status: UiOrderStatus
  total: number
  createdAt: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    price: number
    comment?: string
    extras: string[]
  }>
}

interface PaginatedOrdersResponse {
  items: ApiOrder[]
  total: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface RestaurantSessionSettings {
  isOpen: boolean
  openTime?: string | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'
const SEARCH_DEBOUNCE_MS = 300
const POLL_MS = 15000
const PAGE_SIZE = 10

const EMPTY_META = {
  total: 0,
  page: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
}

function buildFallbackSessionStart(openTime?: string | null) {
  const now = new Date()
  const fallback = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)

  if (!openTime) return fallback.toISOString()

  const [hoursRaw, minutesRaw] = openTime.split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return fallback.toISOString()
  }

  const parsed = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0)
  return parsed.toISOString()
}

function toUiOrders(data: ApiOrder[]): Order[] {
  return data.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    restaurantId: o.restaurantId,
    posOrderNumber: o.posOrderNumber || null,
    status: o.status.toLowerCase() as UiOrderStatus,
    total: o.total,
    createdAt: o.createdAt,
    items: o.items.map((i) => ({
      productId: i.productId,
      productName: i.product.name,
      quantity: i.quantity,
      price: i.priceSnapshot,
      comment: i.comment,
      extras: Array.isArray(i.extrasSnapshot) ? i.extrasSnapshot.map((e) => e.name) : [],
    })),
  }))
}

function formatStatus(status: UiOrderStatus, messages: Record<string, string>) {
  return translate(messages, `status.${status.toUpperCase()}`, status.replace(/_/g, ' '))
}

export default function RestaurantOrdersView({
  restaurantId,
  initialSubTab = 'incoming',
  onOrderStatusUpdated,
  externalRefreshToken,
}: {
  restaurantId: string
  initialSubTab?: OrdersSubTab
  onOrderStatusUpdated?: () => void | Promise<void>
  externalRefreshToken?: number
}) {
  const router = useRouter()
  const { messages } = useLanguage()
  const t = useCallback((key: string, fallback: string) => translate(messages, key, fallback), [messages])

  const [activeSubTab, setActiveSubTab] = useState<OrdersSubTab>(initialSubTab)
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([])
  const [todayOrders, setTodayOrders] = useState<Order[]>([])
  const [incomingMeta, setIncomingMeta] = useState({ ...EMPTY_META })
  const [todayMeta, setTodayMeta] = useState({ ...EMPTY_META })
  const [incomingSearchInput, setIncomingSearchInput] = useState('')
  const [todaySearchInput, setTodaySearchInput] = useState('')
  const [incomingSearch, setIncomingSearch] = useState('')
  const [todaySearch, setTodaySearch] = useState('')
  const [incomingStatus, setIncomingStatus] = useState<FilterStatus>('ALL')
  const [todayStatus, setTodayStatus] = useState<FilterStatus>('ALL')
  const [incomingPage, setIncomingPage] = useState(1)
  const [todayPage, setTodayPage] = useState(1)
  const [loadingIncoming, setLoadingIncoming] = useState(true)
  const [loadingToday, setLoadingToday] = useState(true)
  const [loadingSession, setLoadingSession] = useState(true)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null)
  const [canManageOrders, setCanManageOrders] = useState(false)
  const [posOrderInputs, setPosOrderInputs] = useState<Record<string, string>>({})
  const previousSessionOpenRef = useRef<boolean | null>(null)
  const sessionStorageKey = `unibite-restaurant-session-start-${restaurantId}`

  useEffect(() => {
    setActiveSubTab(initialSubTab)
  }, [initialSubTab])

  useEffect(() => {
    const timer = window.setTimeout(() => setIncomingSearch(incomingSearchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [incomingSearchInput])

  useEffect(() => {
    const timer = window.setTimeout(() => setTodaySearch(todaySearchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [todaySearchInput])

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/restaurant/${restaurantId}/settings`, { credentials: 'include' })
      if (!res.ok) {
        setSessionOpen(false)
        setSessionStartedAt(null)
        return
      }
      const settings = (await res.json()) as RestaurantSessionSettings
      const isOpen = Boolean(settings.isOpen)
      const wasOpen = previousSessionOpenRef.current

      setSessionOpen(isOpen)
      if (!isOpen) {
        setSessionStartedAt(null)
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(sessionStorageKey)
        }
      } else if (wasOpen === false) {
        // New active session starts when restaurant transitions to open.
        const nextAnchor = new Date().toISOString()
        setSessionStartedAt(nextAnchor)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(sessionStorageKey, nextAnchor)
        }
      } else if (wasOpen === null) {
        const storedAnchor =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(sessionStorageKey)
            : null
        const nextAnchor = storedAnchor || buildFallbackSessionStart(settings.openTime)
        setSessionStartedAt(nextAnchor)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(sessionStorageKey, nextAnchor)
        }
      }

      previousSessionOpenRef.current = isOpen
    } catch (error) {
      console.error('Failed to load restaurant session', error)
      setSessionOpen(false)
      setSessionStartedAt(null)
      previousSessionOpenRef.current = false
    } finally {
      setLoadingSession(false)
    }
  }, [restaurantId, sessionStorageKey])

  const fetchOrders = useCallback(async (tab: OrdersSubTab, search: string, status: FilterStatus, page: number) => {
    if (!sessionOpen && tab === 'today') {
      return { orders: [] as Order[], meta: { ...EMPTY_META, page } }
    }

    const params = new URLSearchParams()
    params.set('statuses', mapRestaurantOrderStatuses(tab, status).join(','))
    if (tab === 'today' && sessionStartedAt) params.set('from', sessionStartedAt)
    if (search.trim()) params.set('search', search.trim())
    params.set('page', String(page))
    params.set('pageSize', String(PAGE_SIZE))

    const res = await fetch(`${API_BASE_URL}/order/restaurant/${restaurantId}?${params.toString()}`, {
      credentials: 'include',
    })
    if (!res.ok) {
      throw new Error(t('restaurant.orders.errorFetchOrders', 'Failed to fetch orders'))
    }

    const payload = (await res.json()) as PaginatedOrdersResponse | ApiOrder[]
    if (Array.isArray(payload)) {
      const orders = toUiOrders(payload)
      return { orders, meta: { ...EMPTY_META, total: orders.length, page } }
    }
    return {
      orders: toUiOrders(Array.isArray(payload.items) ? payload.items : []),
      meta: {
        total: Number(payload.total || 0),
        page: Number(payload.page || page),
        totalPages: Number(payload.totalPages || 1),
        hasNextPage: Boolean(payload.hasNextPage),
        hasPreviousPage: Boolean(payload.hasPreviousPage),
      },
    }
  }, [restaurantId, sessionOpen, sessionStartedAt, t])

  const refreshIncoming = useCallback(async () => {
    setLoadingIncoming(true)
    try {
      const { orders, meta } = await fetchOrders('incoming', incomingSearch, incomingStatus, incomingPage)
      setIncomingOrders(orders)
      setIncomingMeta(meta)
    } catch (error) {
      console.error(error)
      setIncomingOrders([])
      setIncomingMeta({ ...EMPTY_META, page: incomingPage })
    } finally {
      setLoadingIncoming(false)
    }
  }, [fetchOrders, incomingSearch, incomingStatus, incomingPage])

  const refreshToday = useCallback(async () => {
    setLoadingToday(true)
    try {
      const { orders, meta } = await fetchOrders('today', todaySearch, todayStatus, todayPage)
      setTodayOrders(orders)
      setTodayMeta(meta)
    } catch (error) {
      console.error(error)
      setTodayOrders([])
      setTodayMeta({ ...EMPTY_META, page: todayPage })
    } finally {
      setLoadingToday(false)
    }
  }, [fetchOrders, todaySearch, todayStatus, todayPage])

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshIncoming(), refreshToday()])
  }, [refreshIncoming, refreshToday])

  useEffect(() => {
    let mounted = true
    const loadPermissions = async () => {
      const user = await checkAuth()
      if (!mounted) return
      setCanManageOrders(Boolean(user?.role === 'RESTAURANT_ADMIN' && user.restaurantId === restaurantId))
    }
    void loadPermissions()
    return () => {
      mounted = false
    }
  }, [restaurantId])

  useEffect(() => {
    // Session state is polled to keep incoming/today filters aligned with open/close changes.
    void refreshSession()
    const interval = window.setInterval(() => void refreshSession(), POLL_MS)
    const handleFocus = () => void refreshSession()
    window.addEventListener('focus', handleFocus)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshSession])

  useEffect(() => {
    void refreshIncoming()
  }, [refreshIncoming])

  useEffect(() => {
    void refreshToday()
  }, [refreshToday])

  useEffect(() => {
    setPosOrderInputs((previous) => {
      const next = { ...previous }
      incomingOrders.forEach((order) => {
        if (order.status !== 'received') return
        if (typeof next[order.id] === 'string') return
        next[order.id] = order.posOrderNumber || ''
      })
      return next
    })
  }, [incomingOrders])

  useEffect(() => {
    // Polling is intentionally kept as a reliability fallback for order list freshness.
    const interval = window.setInterval(() => void refreshAll(), POLL_MS)
    const handleFocus = () => void refreshAll()
    window.addEventListener('focus', handleFocus)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshAll])

  useEffect(() => {
    if (typeof externalRefreshToken !== 'number') return
    void refreshAll()
  }, [externalRefreshToken, refreshAll])

  useEffect(() => setIncomingPage(1), [incomingSearch, incomingStatus, sessionStartedAt])
  useEffect(() => setTodayPage(1), [todaySearch, todayStatus, sessionStartedAt])

  const changeStatus = async (order: Order, status: UiOrderStatus) => {
    if (!canManageOrders) return

    if (order.status === 'received' && status === 'preparing') {
      const posOrderNumber = (posOrderInputs[order.id] || '').trim()
      const posRes = await fetch(`${API_BASE_URL}/order/${order.id}/pos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ posOrderNumber }),
      })

      if (!posRes.ok) {
        const error = await posRes.json()
        await Swal.fire(
          t('common.error', 'Error'),
          error.message || t('restaurant.orders.errorSavePosReference', 'Failed to save POS order number'),
          'error',
        )
        return
      }
    }

    const res = await fetch(`${API_BASE_URL}/order/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: status.toUpperCase() }),
    })
    if (!res.ok) {
      const error = await res.json()
      await Swal.fire(t('common.error', 'Error'), error.message || t('restaurant.orders.errorUpdateStatus', 'Failed to update status'), 'error')
      return
    }
    await refreshAll()
    if (onOrderStatusUpdated) await onOrderStatusUpdated()
  }

  const cancelOrder = async (order: Order) => {
    if (!canManageOrders) return

    let reasonType: CancellationReasonType = 'INTERNAL_ISSUE'
    let comment: string | undefined

    if (activeSubTab === 'incoming' && order.status === 'received') {
      const reasonResult = await Swal.fire({
        title: t('restaurant.orders.cancelReasonTitle', 'Select Cancellation Reason'),
        input: 'select',
        inputOptions: {
          OUT_OF_STOCK: t('student.order.cancelReasonOutOfStock', 'Out of stock'),
          BUSY: t('student.order.cancelReasonBusy', 'Restaurant is busy'),
          INTERNAL_ISSUE: t('student.order.cancelReasonInternalIssue', 'Internal issue'),
          OTHER: t('student.order.cancelReasonOther', 'Other'),
        },
        inputValue: 'INTERNAL_ISSUE',
        showCancelButton: true,
        confirmButtonText: t('common.continue', 'Continue'),
        cancelButtonText: t('restaurant.orders.keepOrder', 'Keep Order'),
      })

      if (!reasonResult.isConfirmed) return
      reasonType = reasonResult.value as CancellationReasonType

      if (reasonType === 'OTHER') {
        const commentResult = await Swal.fire({
          title: t('restaurant.orders.otherReasonCommentTitle', 'Add cancellation details'),
          input: 'textarea',
          inputPlaceholder: t('restaurant.orders.otherReasonCommentPlaceholder', 'Write short reason...'),
          showCancelButton: true,
          confirmButtonText: t('common.confirm', 'Confirm'),
          cancelButtonText: t('restaurant.orders.keepOrder', 'Keep Order'),
          inputValidator: (value) => {
            if (!value || !value.trim()) {
              return t('restaurant.orders.otherReasonCommentRequired', 'Please provide a reason')
            }
            return undefined
          },
        })
        if (!commentResult.isConfirmed) return
        comment = String(commentResult.value || '').trim()
      }
    }

    const result = await Swal.fire({
      title: t('restaurant.orders.cancelOrderTitle', 'Cancel Order'),
      text: t('restaurant.orders.confirmCancel', 'Are you sure you want to cancel this order?'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('restaurant.orders.confirmCancel', 'Confirm Cancel'),
      cancelButtonText: t('restaurant.orders.keepOrder', 'Keep Order'),
    })
    if (!result.isConfirmed) return

    const res = await fetch(`${API_BASE_URL}/order/${order.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        reasonType,
        ...(comment ? { comment } : {}),
      }),
    })
    if (!res.ok) {
      const error = await res.json()
      await Swal.fire(t('common.error', 'Error'), error.message || t('restaurant.orders.errorCancelOrder', 'Failed to cancel order'), 'error')
      return
    }
    await refreshAll()
    if (onOrderStatusUpdated) await onOrderStatusUpdated()
  }

  const activeOrders = activeSubTab === 'incoming' ? incomingOrders : todayOrders
  const activeMeta = activeSubTab === 'incoming' ? incomingMeta : todayMeta
  const activeLoading = loadingSession || (activeSubTab === 'incoming' ? loadingIncoming : loadingToday)
  const activeSearchInput = activeSubTab === 'incoming' ? incomingSearchInput : todaySearchInput
  const setActiveSearchInput = activeSubTab === 'incoming' ? setIncomingSearchInput : setTodaySearchInput
  const activeFilter = activeSubTab === 'incoming' ? incomingStatus : todayStatus
  const setActiveFilter = activeSubTab === 'incoming' ? setIncomingStatus : setTodayStatus

  const goPrev = () => {
    if (activeSubTab === 'incoming') setIncomingPage((p) => Math.max(1, p - 1))
    else setTodayPage((p) => Math.max(1, p - 1))
  }
  const goNext = () => {
    if (!activeMeta.hasNextPage) return
    if (activeSubTab === 'incoming') setIncomingPage((p) => p + 1)
    else setTodayPage((p) => p + 1)
  }

  return (
    <div className={styles.ordersTab}>
      <div className={styles.ordersSubTabs}>
        <button className={`${styles.ordersSubTab} ${activeSubTab === 'incoming' ? styles.ordersSubTabActive : ''}`} onClick={() => setActiveSubTab('incoming')} type="button">
          {t('restaurant.orders.incomingOrders', 'Incoming Orders')}
          <span className={styles.orderCountBadge}>{incomingMeta.total}</span>
        </button>
        <button className={`${styles.ordersSubTab} ${activeSubTab === 'today' ? styles.ordersSubTabActive : ''}`} onClick={() => setActiveSubTab('today')} type="button">
          {t('restaurant.orders.todaysOrders', "Today's Orders")}
          <span className={styles.orderCountBadge}>{todayMeta.total}</span>
        </button>
      </div>

      <div className={styles.ordersToolbar}>
        <input className={styles.orderSearchInput} value={activeSearchInput} onChange={(e) => setActiveSearchInput(e.target.value)} placeholder={t('restaurant.orders.searchPlaceholder', 'Search by order number')} />
        <select className={styles.orderStatusFilter} value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as FilterStatus)}>
          <option value={ORDER_STATUS_FILTER.ALL}>{t('common.all', 'All')}</option>
          <option value={ORDER_STATUS_FILTER.PENDING}>{t('restaurant.orders.pending', 'Pending')}</option>
          <option value={ORDER_STATUS_FILTER.PREPARING}>{t('status.PREPARING', 'Preparing')}</option>
          <option value={ORDER_STATUS_FILTER.READY}>{t('status.READY', 'Ready')}</option>
          <option value={ORDER_STATUS_FILTER.COMPLETED}>{t('status.COMPLETED', 'Completed')}</option>
          <option value={ORDER_STATUS_FILTER.CANCELLED}>{t('status.CANCELLED', 'Cancelled')}</option>
        </select>
      </div>

      {activeLoading ? (
        <p>{t('restaurant.orders.loading', 'Loading orders...')}</p>
      ) : !sessionOpen && activeSubTab === 'today' ? (
        <p className={styles.emptyMessage}>{t('restaurant.orders.closedSessionEmpty', 'Restaurant is closed. Open the restaurant to view current-session orders.')}</p>
      ) : activeOrders.length === 0 ? (
        <p className={styles.emptyMessage}>{t('restaurant.orders.emptyIncoming', 'No orders found.')}</p>
      ) : (
        <>
          <div className={styles.ordersList}>
            {activeOrders.map((order) => (
              <article key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div>
                    <p className={styles.orderId}>#{order.orderNumber}</p>
                    <p className={styles.orderTime}>{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[order.status]}`}>{formatStatus(order.status, messages)}</span>
                </div>
                <div className={styles.orderItems}>
                  {order.items.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className={styles.orderItem}>
                      <span className={styles.itemName}>{item.productName} x {item.quantity}</span>
                      {item.comment ? <p className={styles.itemComment}>{t('restaurant.orders.note', 'Note')}: {item.comment}</p> : null}
                      {item.extras.length > 0 ? <p className={styles.itemSauces}>{t('restaurant.orders.extras', 'Extras')}: {item.extras.join(', ')}</p> : null}
                    </div>
                  ))}
                </div>
                <p className={styles.orderTotal}>{t('restaurant.orders.total', 'Total')}: {order.total} EGP</p>
                {canManageOrders && order.status === 'received' ? (
                  <div className={styles.posReferenceSection}>
                    <label className={styles.posReferenceLabel} htmlFor={`pos-order-${order.id}`}>
                      {t('restaurant.orders.posReferenceLabel', 'POS order number (optional)')}
                    </label>
                    <input
                      id={`pos-order-${order.id}`}
                      type="text"
                      className={styles.posReferenceInput}
                      value={posOrderInputs[order.id] ?? ''}
                      onChange={(event) =>
                        setPosOrderInputs((previous) => ({
                          ...previous,
                          [order.id]: event.target.value,
                        }))
                      }
                      placeholder={t('restaurant.orders.posReferencePlaceholder', 'Enter POS reference')}
                      maxLength={50}
                    />
                    <p className={styles.infoText}>
                      {t(
                        'restaurant.orders.posReferenceHint',
                        'Optional: Match app order number with POS system number.',
                      )}
                    </p>
                  </div>
                ) : null}
                <div className={styles.orderActions}>
                  {canManageOrders && order.status === 'received' ? (
                    <>
                      <button className={styles.actionButton} onClick={() => void changeStatus(order, 'preparing')}>{t('restaurant.orders.actionPreparing', 'Preparing')}</button>
                      <button className={`${styles.actionButton} ${styles.cancelButton}`} onClick={() => void cancelOrder(order)}>{t('restaurant.orders.actionCancelOrder', 'Cancel Order')}</button>
                    </>
                  ) : null}
                  {canManageOrders && order.status === 'preparing' ? (
                    <>
                      <button className={styles.actionButton} onClick={() => void changeStatus(order, 'ready')}>{t('restaurant.orders.actionReady', 'Ready')}</button>
                      <button className={`${styles.actionButton} ${styles.cancelButton}`} onClick={() => void cancelOrder(order)}>{t('restaurant.orders.actionCancelOrder', 'Cancel Order')}</button>
                    </>
                  ) : null}
                  {canManageOrders && order.status === 'ready' ? (
                    <>
                      <button className={styles.actionButton} onClick={() => void changeStatus(order, 'delivered_to_student')}>{t('restaurant.orders.actionHandedToStudent', 'Handed to Student')}</button>
                      <button className={`${styles.actionButton} ${styles.cancelButton}`} onClick={() => void cancelOrder(order)}>{t('restaurant.orders.actionCancelOrder', 'Cancel Order')}</button>
                    </>
                  ) : null}
                  <button className={`${styles.actionButton} ${styles.detailsActionButton}`} onClick={() => router.push(`/orders/${order.id}`)}>
                    {t('common.viewDetails', 'View Details')}
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.paginationControls}>
            <button type="button" className={styles.paginationButton} onClick={goPrev} disabled={!activeMeta.hasPreviousPage}>
              {t('common.previous', 'Previous')}
            </button>
            <span className={styles.paginationInfo}>{t('common.page', 'Page')} {activeMeta.page} / {activeMeta.totalPages}</span>
            <button type="button" className={styles.paginationButton} onClick={goNext} disabled={!activeMeta.hasNextPage}>
              {t('common.next', 'Next')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
