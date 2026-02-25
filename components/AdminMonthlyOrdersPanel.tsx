'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Restaurant } from '@/lib/api'
import { mapAdminOrderStatusFilter, type OrderStatusFilter } from '@/lib/orderFilters'
import {
  ORDER_STATUS_FILTER,
  formatOrderStatus,
  type OrderStatus,
} from '@/lib/status'
import styles from '@/app/admin/dashboard/admin.module.css'

type StatusFilter = OrderStatusFilter

interface AdminOrder {
  id: string
  orderNumber: number
  status: OrderStatus
  total: number
  paymentMethod: 'CARD'
  createdAt: string
  restaurant: {
    id: string
    name: string
  }
  student: {
    id: string
    email: string
    name?: string | null
  }
}

interface PaginatedResponse {
  items: AdminOrder[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'
const PAGE_SIZE = 10

function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export default function AdminMonthlyOrdersPanel({
  restaurants,
  initialRestaurantId,
}: {
  restaurants: Restaurant[]
  initialRestaurantId?: string
}) {
  const router = useRouter()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [restaurantFilter, setRestaurantFilter] = useState<string>(
    initialRestaurantId || 'all',
  )
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  const monthRange = useMemo(() => getCurrentMonthRange(), [])

  useEffect(() => {
    setRestaurantFilter(initialRestaurantId || 'all')
    setPage(1)
  }, [initialRestaurantId])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('from', monthRange.start)
      params.set('to', monthRange.end)
      params.set('page', String(page))
      params.set('pageSize', String(PAGE_SIZE))

      const mappedStatus = mapAdminOrderStatusFilter(statusFilter)
      if (mappedStatus) {
        params.set('status', mappedStatus)
      }

      if (restaurantFilter !== 'all') {
        params.set('restaurantId', restaurantFilter)
      }

      const response = await fetch(`${API_BASE_URL}/order/admin?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.message || 'Failed to fetch monthly orders')
      }

      const data = (await response.json()) as PaginatedResponse
      setOrders(Array.isArray(data.items) ? data.items : [])
      setMeta({
        total: Number(data.total || 0),
        page: Number(data.page || page),
        totalPages: Number(data.totalPages || 1),
        hasNextPage: Boolean(data.hasNextPage),
        hasPreviousPage: Boolean(data.hasPreviousPage),
      })
    } catch (err: any) {
      setError(err.message || 'Failed to fetch monthly orders')
      setOrders([])
      setMeta({
        total: 0,
        page,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      })
    } finally {
      setLoading(false)
    }
  }, [monthRange.end, monthRange.start, page, restaurantFilter, statusFilter])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    setPage(1)
  }, [restaurantFilter, statusFilter])

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Monthly Orders</h2>
      <p className={styles.infoText}>
        Showing orders for the current month only.
      </p>

      <div className={styles.ordersFilterRow}>
        <select
          value={restaurantFilter}
          onChange={(e) => setRestaurantFilter(e.target.value)}
          className={styles.selectorDropdown}
        >
          <option value="all">All Restaurants</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className={styles.selectorDropdown}
        >
          <option value={ORDER_STATUS_FILTER.ALL}>All</option>
          <option value={ORDER_STATUS_FILTER.PENDING}>Pending</option>
          <option value={ORDER_STATUS_FILTER.PREPARING}>Preparing</option>
          <option value={ORDER_STATUS_FILTER.READY}>Ready</option>
          <option value={ORDER_STATUS_FILTER.COMPLETED}>Completed</option>
          <option value={ORDER_STATUS_FILTER.CANCELLED}>Cancelled</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.infoText}>Loading monthly orders...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : orders.length === 0 ? (
        <p className={styles.infoText}>No monthly orders for the selected filters.</p>
      ) : (
        <>
          <div className={styles.restaurantsList}>
            {orders.map((order) => (
              <article key={order.id} className={styles.restaurantCard}>
                <div className={styles.restaurantInfo}>
                  <h3 className={styles.restaurantName}>Order #{order.orderNumber}</h3>
                  <p className={styles.detailItem}>
                    <strong>Restaurant:</strong> {order.restaurant.name}
                  </p>
                  <p className={styles.detailItem}>
                    <strong>Student:</strong> {order.student.name || order.student.email}
                  </p>
                  <p className={styles.detailItem}>
                    <strong>Status:</strong> {formatOrderStatus(order.status)}
                  </p>
                  <p className={styles.detailItem}>
                    <strong>Payment:</strong> {order.paymentMethod}
                  </p>
                  <p className={styles.detailItem}>
                    <strong>Total:</strong> {Number(order.total).toFixed(2)} EGP
                  </p>
                  <p className={styles.detailItem}>
                    <strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className={styles.restaurantActions}>
                  <button
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.ordersPaginationRow}>
            <button
              type="button"
              className={styles.toggleButton}
              disabled={!meta.hasPreviousPage}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <span className={styles.infoText}>
              Page {meta.page} / {meta.totalPages} ({meta.total} orders)
            </span>
            <button
              type="button"
              className={styles.toggleButton}
              disabled={!meta.hasNextPage}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}
