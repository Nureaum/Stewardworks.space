'use client'

import { HelpdeskAnswer } from '@/types/helpdesk'
import { Clock, ShieldCheck } from 'lucide-react'

interface Props {
  answer: HelpdeskAnswer
}

export default function AnswerBlock({ answer }: Props) {
  return (
    <div className="bg-steward-green/5 border border-steward-green/20 rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-steward-green text-white flex items-center justify-center font-bold">
            {answer.author?.full_name?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{answer.author?.full_name || 'Staff Member'}</span>
              <ShieldCheck className="w-4 h-4 text-steward-green" />
            </div>
            <span className="text-xs font-medium text-steward-green capitalize">
              {answer.author?.role?.replace('_', ' ') || 'Staff'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{new Date(answer.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div 
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: answer.content }}
      />
      
      {answer.is_promoted_to_faq && (
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
          ★ Promoted to FAQ
        </div>
      )}
    </div>
  )
}
