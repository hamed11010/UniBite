'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { checkAuth, hasRole } from '@/lib/auth'
import { confirmStudentReportResolved } from '@/lib/api'
import { type Messages, translate } from '@/lib/i18n'
import { ORDER_STATUS, type OrderStatus } from '@/lib/status'
import styles from './orders.module.css'

type PageTab = 'active' | 'past' | 'reports'
type PaymentMethod = 'CARD'
type ReportStatus =
  | 'PENDING'
  | 'RESOLVED_BY_RESTAURANT'
  | 'CONFIRMED_BY_STUDENT'
  | 'ESCALATED'

type StudentOrder = {
  id: string
  orderNumber: number
  status: OrderStatus
  total: number
  paymentMethod: PaymentMethod
  createdAt: string
  restaurant: {
    id: string
    name: string
  }
}

type StudentReport = {
  id: string
  type: string
  status: ReportStatus
  createdAt: string
  updatedAt: string
  restaurant: {
    id: string
    name: string
  }
  order?: {
    id: string
    orderNumber: number
  } | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  ORDER_STATUS.RECEIVED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.DELIVERED_TO_STUDENT,
]
const PAST_ORDER_STATUSES: OrderStatus[] = [
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
]

function formatStatusLabel(value: string, messages: Messages) {
  return translate(messages, `status.${value}`, value.replace(/_/g, ' '))
}

export default function StudentOrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { messages, locale } = useLanguage()
  const [activeTab, setActiveTab] = useState<PageTab>('active')
  const [orders, setOrders] = useState<StudentOrder[]>([])
  const [reports, setReports] = useState<StudentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingReportId, setConfirmingReportId] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/order/student`, {
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error(translate(messages, 'student.orders.errorFetchOrders', 'Failed to fetch your orders'))
    }

    const data = await res.json()
    const nextOrders = Array.isArray(data) ? (data as StudentOrder[]) : []
    setOrders(nextOrders)
  }, [messages])

  const loadReports = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/reports/student`, {
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error(translate(messages, 'student.orders.errorFetchReports', 'Failed to fetch your reports'))
    }

    const data = await res.json()
    const nextReports = Array.isArray(data) ? (data as StudentReport[]) : []
    setReports(nextReports)
  }, [messages])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const init = async () => {
      try {
        const user = await checkAuth()
        if (!user || !hasRole(user, 'STUDENT')) {
          router.push('/auth/login')
          return
        }

        await Promise.all([loadOrders(), loadReports()])
      } catch (err: any) {
        setError(err?.message || translate(messages, 'student.orders.errorLoadData', 'Failed to load your data'))
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [router, loadOrders, loadReports, messages])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'active' || tab === 'past' || tab === 'reports') {
      setActiveTab(tab)
    }
  }, [searchParams])

  const ordersWithinThirtyDays = useMemo(() => {
    const threshold = Date.now() - THIRTY_DAYS_MS
    return orders
      .filter((order) => new Date(order.createdAt).getTime() >= threshold)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders])

  const activeOrders = useMemo(
    () =>
      ordersWithinThirtyDays.filter((order) =>
        ACTIVE_ORDER_STATUSES.includes(order.status),
      ),
    [ordersWithinThirtyDays],
  )

  const pastOrders = useMemo(
    () =>
      ordersWithinThirtyDays.filter((order) =>
        PAST_ORDER_STATUSES.includes(order.status),
      ),
    [ordersWithinThirtyDays],
  )

  const sortedReports = useMemo(
    () =>
      [...reports].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [reports],
  )

  const handleConfirmReport = useCallback(
    async (reportId: string) => {
      setConfirmingReportId(reportId)
      try {
        const updated = await confirmStudentReportResolved(reportId)
        setReports((prev) =>
          prev.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  status: 'CONFIRMED_BY_STUDENT',
                  updatedAt: updated.updatedAt || new Date().toISOString(),
                }
              : report,
          ),
        )

        const Swal = (await import('sweetalert2')).default
        await Swal.fire({
          icon: 'success',
          title: translate(
            messages,
            'student.orders.confirmSuccess',
            'Report confirmed as resolved',
          ),
          timer: 1400,
          showConfirmButton: false,
        })
      } catch (err: any) {
        const Swal = (await import('sweetalert2')).default
        await Swal.fire({
          icon: 'error',
          title: translate(
            messages,
            'student.orders.errorConfirmReport',
            'Failed to confirm report',
          ),
          text: err?.message || translate(messages, 'common.tryAgain', 'Please try again.'),
        })
      } finally {
        setConfirmingReportId(null)
      }
    },
    [messages],
  )

  if (loading) {
    return <div className={styles.loading}>{translate(messages, 'student.orders.loading', 'Loading your orders...')}</div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{translate(messages, 'student.orders.title', 'My Orders')}</h1>
        <p className={styles.subtitle}>
          {translate(messages, 'student.orders.subtitle', 'Active and past orders are shown for the last 30 days.')}
        </p>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'active' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('active')}
        >
          {translate(messages, 'student.orders.tabActive', 'Active Orders')}
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'past' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('past')}
        >
          {translate(messages, 'student.orders.tabPast', 'Past Orders')}
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'reports' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          {translate(messages, 'student.orders.tabReports', 'Reports')}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {activeTab === 'active' && (
        <OrdersList
          title={translate(messages, 'student.orders.activeTitle', 'Active Orders')}
          orders={activeOrders}
          emptyText={translate(messages, 'student.orders.emptyActive', 'No active orders in the last 30 days.')}
          messages={messages}
          locale={locale}
          onViewDetails={(orderId) => router.push(`/student/order/${orderId}`)}
        />
      )}

      {activeTab === 'past' && (
        <OrdersList
          title={translate(messages, 'student.orders.pastTitle', 'Past Orders')}
          orders={pastOrders}
          emptyText={translate(messages, 'student.orders.emptyPast', 'No past orders in the last 30 days.')}
          messages={messages}
          locale={locale}
          onViewDetails={(orderId) => router.push(`/student/order/${orderId}`)}
        />
      )}

      {activeTab === 'reports' && (
        <ReportsList
          reports={sortedReports}
          messages={messages}
          locale={locale}
          confirmingReportId={confirmingReportId}
          onConfirmReport={handleConfirmReport}
        />
      )}
    </div>
  )
}

function OrdersList({
  title,
  orders,
  emptyText,
  messages,
  locale,
  onViewDetails,
}: {
  title: string
  orders: StudentOrder[]
  emptyText: string
  messages: Messages
  locale: string
  onViewDetails: (orderId: string) => void
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {orders.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <div className={styles.list}>
          {orders.map((order) => (
            <article key={order.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.orderNumber}>
                    {translate(messages, 'student.orders.orderNumber', 'Order')} #{order.orderNumber}
                  </p>
                  <p className={styles.meta}>{order.restaurant.name}</p>
                </div>
                <span className={styles.statusBadge}>{formatStatusLabel(order.status, messages)}</span>
              </div>

              <div className={styles.metaGrid}>
                <p>
                  <strong>{translate(messages, 'student.orders.total', 'Total')}:</strong> {order.total} EGP
                </p>
                <p>
                  <strong>{translate(messages, 'student.orders.payment', 'Payment')}:</strong>{' '}
                  {translate(messages, `payment.${order.paymentMethod}`, order.paymentMethod)}
                </p>
                <p>
                  <strong>{translate(messages, 'student.orders.created', 'Created')}:</strong>{' '}
                  {new Date(order.createdAt).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                </p>
              </div>

              <button
                type="button"
                className={styles.detailsButton}
                onClick={() => onViewDetails(order.id)}
              >
                {translate(messages, 'student.orders.viewDetails', 'View Details')}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function ReportsList({
  reports,
  messages,
  locale,
  confirmingReportId,
  onConfirmReport,
}: {
  reports: StudentReport[]
  messages: Messages
  locale: string
  confirmingReportId: string | null
  onConfirmReport: (reportId: string) => Promise<void>
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{translate(messages, 'student.orders.reportsTitle', 'Reports')}</h2>
      {reports.length === 0 ? (
        <p className={styles.empty}>
          {translate(messages, 'student.orders.emptyReports', 'No reports submitted yet.')}
        </p>
      ) : (
        <div className={styles.list}>
          {reports.map((report) => (
            <article key={report.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.orderNumber}>{formatStatusLabel(report.type, messages)}</p>
                  <p className={styles.meta}>{report.restaurant.name}</p>
                </div>
                <span className={styles.statusBadge}>
                  {formatStatusLabel(report.status, messages)}
                </span>
              </div>

              <div className={styles.metaGrid}>
                {report.order?.orderNumber ? (
                  <p>
                    <strong>{translate(messages, 'student.orders.order', 'Order')}:</strong> #{report.order.orderNumber}
                  </p>
                ) : (
                  <p>
                    <strong>{translate(messages, 'student.orders.order', 'Order')}:</strong>{' '}
                    {translate(messages, 'common.na', 'N/A')}
                  </p>
                )}
                <p>
                  <strong>{translate(messages, 'student.orders.created', 'Created')}:</strong>{' '}
                  {new Date(report.createdAt).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                </p>
                <p>
                  <strong>{translate(messages, 'student.orders.updated', 'Updated')}:</strong>{' '}
                  {new Date(report.updatedAt).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                </p>
              </div>
              {report.status === 'RESOLVED_BY_RESTAURANT' && (
                <button
                  type="button"
                  className={styles.detailsButton}
                  onClick={() => void onConfirmReport(report.id)}
                  disabled={confirmingReportId === report.id}
                >
                  {confirmingReportId === report.id
                    ? translate(messages, 'student.orders.confirming', 'Confirming...')
                    : translate(messages, 'student.orders.confirmResolved', 'Confirm Resolved')}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
