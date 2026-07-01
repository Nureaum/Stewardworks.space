'use client'

import { HelpdeskAnswer } from '@/types/helpdesk'
import { Clock, ShieldCheck } from 'lucide-react'

interface Props {
  answer: HelpdeskAnswer
}

export default function AnswerBlock({ answer }: Props) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative">
      <h3 className="text-xs font-black text-steward-green mb-6 uppercase tracking-widest pl-4">Official Answer</h3>
      <div className="absolute left-0 top-10 bottom-10 w-1.5 bg-gradient-to-b from-steward-green to-steward-blue rounded-r-full"></div>
      
      <div 
        className="prose prose-lg max-w-none text-steward-dark pl-4 font-medium leading-relaxed whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: answer.content }}
      />
    </div>
  )
}
