"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  read: boolean
  createdAt: string
  metadata?: any
}

export function NotificationSystem() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!session?.user) return

    // Fetch initial notifications
    fetchNotifications()

    // Set up polling for new notifications (in a real app, use WebSockets)
    const interval = setInterval(fetchNotifications, 10000) // Poll every 10 seconds

    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission()
    }

    return () => clearInterval(interval)
  }, [session])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds, markAsRead: true })
      })
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical'
      })
    }
  }

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'critical') return <AlertCircle className="w-5 h-5 text-red-500" />
    if (priority === 'high') return <AlertTriangle className="w-5 h-5 text-orange-500" />
    if (type === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />
    return <Info className="w-5 h-5 text-blue-500" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 border-red-300'
      case 'high': return 'bg-orange-100 border-orange-300'
      case 'medium': return 'bg-blue-100 border-blue-300'
      case 'low': return 'bg-gray-100 border-gray-300'
      default: return 'bg-gray-100 border-gray-300'
    }
  }

  if (!session?.user) return null

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAsRead(notifications.filter(n => !n.read).map(n => n.id))}
                className="mt-2 text-xs"
              >
                Mark all as read
              </Button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`m-2 cursor-pointer transition-colors ${
                    !notification.read ? getPriorityColor(notification.priority) : 'bg-gray-50'
                  }`}
                  onClick={() => !notification.read && markAsRead([notification.id])}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type, notification.priority)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <p className={`text-xs mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 text-center">
              <Button variant="ghost" size="sm" className="text-xs">
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
