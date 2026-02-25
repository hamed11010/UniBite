'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Socket } from 'socket.io-client'
import {
  fetchNotifications,
  fetchUnreadNotificationsCount,
  markNotificationAsRead,
  type NotificationItem,
} from '@/lib/api'
import styles from './notification-bell.module.css'

type NotificationBellProps = {
  socket?: Socket | null
}

type NotificationNewPayload = NotificationItem & {
  unreadCount?: number
}

function formatRelativeDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

export default function NotificationBell({ socket }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])

  const visibleItems = useMemo(() => items.slice(0, 8), [items])

  const loadUnreadCount = useCallback(async () => {
    try {
      const payload = await fetchUnreadNotificationsCount()
      setUnreadCount(payload.unreadCount ?? 0)
    } catch (error) {
      console.error('Failed to fetch unread count', error)
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      const payload = await fetchNotifications()
      setItems(Array.isArray(payload) ? payload : [])
    } catch (error) {
      console.error('Failed to fetch notifications', error)
    }
  }, [])

  useEffect(() => {
    void loadUnreadCount()
    void loadNotifications()
  }, [loadUnreadCount, loadNotifications])

  useEffect(() => {
    if (!socket) return

    const onNewNotification = (payload: NotificationNewPayload) => {
      setItems((prev) => [payload, ...prev.filter((item) => item.id !== payload.id)])

      if (typeof payload.unreadCount === 'number') {
        setUnreadCount(payload.unreadCount)
      } else {
        setUnreadCount((prev) => prev + 1)
      }
    }

    socket.on('notification:new', onNewNotification)
    return () => {
      socket.off('notification:new', onNewNotification)
    }
  }, [socket])

  const handleMarkRead = async (notificationId: string) => {
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
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        Notifications
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <p className={styles.title}>Recent Notifications</p>
          </div>
          {visibleItems.length === 0 ? (
            <p className={styles.empty}>No notifications yet.</p>
          ) : (
            <ul className={styles.list}>
              {visibleItems.map((item) => (
                <li
                  key={item.id}
                  className={`${styles.item} ${item.isRead ? '' : styles.itemUnread}`}
                >
                  <p className={styles.itemTitle}>{item.title}</p>
                  <p className={styles.itemMessage}>{item.message}</p>
                  <div className={styles.itemMeta}>
                    <span className={styles.time}>
                      {formatRelativeDateTime(item.createdAt)}
                    </span>
                    {!item.isRead && (
                      <button
                        type="button"
                        className={styles.markReadButton}
                        onClick={() => void handleMarkRead(item.id)}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/notifications" className={styles.footer}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
