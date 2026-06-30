import React from 'react'
import NotificationsMenu from '@/components/layout/NotificationsMenu'

export default function HelpdeskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="font-semibold text-gray-900">
            <span className="text-steward-green">Steward</span>Works Support
          </div>
          <div className="flex items-center gap-4">
            <NotificationsMenu />
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
