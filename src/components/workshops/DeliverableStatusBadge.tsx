'use client'

import { DeliverableStatusBadgeProps } from '@/types/workshops'
import { Clock, CheckCircle, XCircle, Circle } from 'lucide-react'

export default function DeliverableStatusBadge({ status, reviewNote }: DeliverableStatusBadgeProps) {
  const config = {
    not_submitted: {
      icon: Circle,
      color: 'bg-gray-100 text-gray-600 border-gray-200',
      label: 'Not Submitted',
      tooltip: 'You haven\'t submitted this deliverable yet',
    },
    submitted: {
      icon: Clock,
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      label: 'Submitted',
      tooltip: 'Your submission is awaiting review',
    },
    approved: {
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700 border-green-200',
      label: 'Approved',
      tooltip: 'Your submission has been approved',
    },
    rejected: {
      icon: XCircle,
      color: 'bg-red-100 text-red-700 border-red-200',
      label: 'Rejected',
      tooltip: reviewNote || 'Your submission needs revision',
    },
  }

  const { icon: Icon, color, label, tooltip } = config[status]

  return (
    <div className="group relative inline-flex">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${color}`}>
        <Icon className="w-4 h-4" />
        {label}
      </span>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {tooltip}
        {reviewNote && status === 'rejected' && (
          <div className="mt-1 text-xs text-gray-300 max-w-xs whitespace-normal">
            {reviewNote}
          </div>
        )}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  )
}
