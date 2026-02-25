'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ProtectedRolePage from '@/components/ProtectedRolePage'
import {
  fetchNotifications,
  fetchUnreadNotificationsCount,
  markNotificationAsRead,
  type NotificationItem,
} from '@/lib/api'
import styles from './notifications.module.css'

function NotificationsContent() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [notifications, unread] = await Promise.all([
        fetchNotifications(),
        fetchUnreadNotificationsCount(),
      ])
      setItems(Array.isArray(notifications) ? notifications : [])
      setUnreadCount(unread.unreadCount ?? 0)
    } catch (error) {
      console.error('Failed to load notifications', error)
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [items],
  )

  const markRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setItems((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        ),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read', error)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Notifications</h1>
      <div className={styles.actions}>
        <span className={styles.unreadBadge}>Unread: {unreadCount}</span>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => void load()}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading notifications...</p>
      ) : sortedItems.length === 0 ? (
        <p className={styles.empty}>No notifications yet.</p>
      ) : (
        <ul className={styles.list}>
          {sortedItems.map((item) => (
            <li
              key={item.id}
              className={`${styles.item} ${item.isRead ? '' : styles.itemUnread}`}
            >
              <p className={styles.itemTitle}>{item.title}</p>
              <p className={styles.itemMessage}>{item.message}</p>
              <div className={styles.meta}>
                <span className={styles.time}>
                  {new Date(item.createdAt).toLocaleString()}
                </span>
                {!item.isRead && (
                  <button
                    type="button"
                    className={styles.markReadButton}
                    onClick={() => void markRead(item.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  return <ProtectedRolePage>{() => <NotificationsContent />}</ProtectedRolePage>
}
