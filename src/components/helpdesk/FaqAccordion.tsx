'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface FaqAccordionProps {
  faqs: any[]
}

export default function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  if (!faqs || faqs.length === 0) return null

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index
        return (
          <div 
            key={faq.id} 
            className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
              isOpen 
                ? 'border-steward-gold/50 shadow-lg shadow-steward-gold/10' 
                : 'border-gray-100 hover:border-steward-gold/30 hover:shadow-md'
            }`}
          >
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
            >
              <h3 className={`font-bold text-lg transition-colors pr-6 ${isOpen ? 'text-steward-gold' : 'text-gray-900 group-hover:text-steward-gold/80'}`}>
                {faq.question?.title}
              </h3>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-steward-gold text-white rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-steward-gold/10 group-hover:text-steward-gold'}`}>
                <ChevronDown className="w-5 h-5" />
              </div>
            </button>
            
            <div 
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-6 pb-6">
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-gray-600 prose max-w-none mb-4 whitespace-pre-wrap mt-4">
                      {faq.content}
                    </div>
                    <Link 
                      href={`/hub/helpdesk/${faq.question?.id}`} 
                      className="inline-flex items-center gap-2 text-steward-gold font-bold text-sm hover:gap-3 transition-all uppercase tracking-widest bg-steward-gold/5 px-4 py-2 rounded-lg hover:bg-steward-gold/10"
                    >
                      Read full discussion <span className="text-xl leading-none">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
