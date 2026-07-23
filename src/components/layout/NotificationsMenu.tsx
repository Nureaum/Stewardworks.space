'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { getUnreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions/notificationActions'
import { HelpdeskNotification } from '@/types/helpdesk'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotificationsMenu() {
  const [notifications, setNotifications] = useState<HelpdeskNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Fetch notifications initially and optionally set up a polling or realtime subscription
    const fetchNotifications = async () => {
      const data = await getUnreadNotifications()
      setNotifications(data)
    }
    
    fetchNotifications()

    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleNotificationClick = async (notif: HelpdeskNotification) => {
    // Optimistically mark as read in the UI
    if (!notif.is_read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? {...n, is_read: true} : n))
      // Mark as read in DB
      await markNotificationAsRead(notif.id)
    }
    
    // Navigate if there's a link
    if (notif.link) {
      setIsOpen(false)
      router.push(notif.link)
    }
  }

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({...n, is_read: true})))
    await markAllNotificationsAsRead()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-steward-green hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer block`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-medium text-sm ${notif.is_read ? 'text-gray-600' : 'text-gray-900'}`}>{notif.title}</h4>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{notif.message}</p>
                    {!notif.is_read && (
                      <span className="inline-block mt-1 text-[9px] font-bold text-steward-green bg-steward-green/10 px-2 py-0.5 rounded-full uppercase tracking-wider">New</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50">
            <Link href="/hub/helpdesk" onClick={() => setIsOpen(false)} className="text-xs font-medium text-gray-500 hover:text-gray-900">
              View Help Desk
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
