'use client'

import { WorkshopDayStepperProps } from '@/types/workshops'
import { ChevronDown, ChevronUp, Lock, BookOpen, PlayCircle, FileText, Link as LinkIcon, ArrowRight, Circle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTopicProgress } from '@/hooks/useTopicProgress'

export default function WorkshopDayStepper({ days, cohortId, currentDayNumber }: WorkshopDayStepperProps) {
  const defaultExpanded = days.find(d => d.day_number === currentDayNumber)?.id || days[0]?.id
  const [expandedId, setExpandedId] = useState<string | null>(defaultExpanded || null)
  const { isTopicComplete, completedTopics } = useTopicProgress(cohortId)

  // Force re-render when completedTopics changes (localStorage)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Helper to check if a day is completed
  const isDayCompleted = (day: typeof days[0]) => {
    const hasTopics = day.media && day.media.length > 0
    const allTopicsCompleted = hasTopics && mounted && day.media!.every(m => isTopicComplete(m.id))
    return allTopicsCompleted || (day.progress?.deliverable_status === 'approved')
  }

  // Iterate to override unlocked states
  const enhancedDays = days.map((day, index) => {
    let isUnlocked = day.unlocked
    if (!isUnlocked && index > 0) {
      const previousDay = days[index - 1]
      if (isDayCompleted(previousDay)) {
        isUnlocked = true
      }
    }
    return { ...day, isUnlocked, isCompleted: isDayCompleted(day) }
  })

  return (
    <div className="w-full flex flex-col">
      {enhancedDays.map((day) => {
        const { isUnlocked, isCompleted } = day
        const isExpanded = expandedId === day.id
        const hasTopics = day.media && day.media.length > 0

        if (!isUnlocked) {
          // Locked State
          return (
            <div key={day.id} className="bg-white border border-[#ECE6D4] rounded-[14px] mb-3 px-[18px] py-4 flex items-center justify-between opacity-80">
              <div className="flex items-center gap-3">
                <div className="w-[26px] h-[26px] rounded-full bg-[#F0ECE0] text-[#B3A98F] flex items-center justify-center text-xs font-medium">
                  {day.day_number}
                </div>
                <span className="text-[14.5px] font-medium text-[#B3A98F]">
                  Day {day.day_number}: {day.title}
                </span>
              </div>
              <Lock className="w-3.5 h-3.5 text-[#CBC1A6]" />
            </div>
          )
        }

        // Unlocked State (Expanded or Collapsed)
        return (
          <div 
            key={day.id} 
            className={`bg-white rounded-[14px] mb-3 overflow-hidden transition-all duration-200 ${
              isExpanded ? 'border border-steward-orange' : 'border border-[#ECE6D4] hover:border-steward-orange/50'
            }`}
          >
            {/* Header (Clickable) */}
            <button 
              onClick={() => setExpandedId(isExpanded ? null : day.id)}
              className="w-full px-[18px] py-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted ? 'bg-steward-green text-steward-offwhite' : 'bg-steward-orange text-steward-dark'
                }`}>
                  {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : day.day_number}
                </div>
                <span className={`text-[14.5px] font-medium ${isCompleted ? 'text-steward-green' : 'text-steward-dark'}`}>
                  Day {day.day_number}: {day.title}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-steward-gold" />
              ) : (
                <ChevronDown className="w-4 h-4 text-steward-gold/60" />
              )}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-[18px] pb-[18px]">
                <div className="text-[11px] font-medium text-[#A38B5C] uppercase tracking-[0.06em] mb-2.5">
                  Topics in this section
                </div>

                {hasTopics ? (
                  <div className="space-y-2 mb-4">
                    {day.media.map(media => {
                      const isArticle = media.url?.startsWith('internal_html:') || media.media_type === 'image'
                      const isVideo = media.media_type === 'video_link'
                      const isDoc = media.media_type === 'pdf'
                      const topicFinished = mounted && isTopicComplete(media.id)

                      return (
                        <div key={media.id} className="flex items-center gap-[11px] px-[13px] py-[11px] bg-steward-offwhite border border-[#F0E6C8] rounded-lg">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${topicFinished ? 'bg-steward-green' : 'bg-steward-blue'}`}>
                            {topicFinished ? <CheckCircle className="w-3.5 h-3.5 text-steward-offwhite" /> :
                             isVideo ? <PlayCircle className="w-3.5 h-3.5 text-steward-offwhite" /> : 
                             isDoc ? <FileText className="w-3.5 h-3.5 text-steward-offwhite" /> : 
                             isArticle ? <BookOpen className="w-3.5 h-3.5 text-steward-offwhite" /> :
                             <LinkIcon className="w-3.5 h-3.5 text-steward-offwhite" />}
                          </div>
                          <span className={`text-[13px] ${topicFinished ? 'text-steward-green font-medium' : 'text-steward-dark'}`}>
                            {media.label || (isArticle ? 'Article Content' : isVideo ? 'Video Content' : 'Document')}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="px-[13px] py-[11px] bg-gray-50 border border-gray-100 rounded-lg mb-4">
                    <span className="text-[13px] text-gray-500 italic">No topics assigned for this day.</span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 flex-wrap">
                  <Link
                    href={`/hub/pilot-workshops/${cohortId}/day/${day.day_number}`}
                    className="flex items-center gap-[7px] bg-steward-green text-steward-offwhite px-[18px] py-2.5 rounded-lg text-[12.5px] font-medium hover:opacity-90 transition-opacity"
                  >
                    {isCompleted ? 'Review day' : 'Start learning'} 
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E3D6AC] rounded-full text-[11.5px] font-medium text-[#9A8C6A]">
                    {isCompleted ? (
                      <CheckCircle className="w-[13px] h-[13px] text-steward-green" />
                    ) : (
                      <Circle className="w-[13px] h-[13px]" />
                    )}
                    <span>
                      {isCompleted ? 'Completed' : 'Not submitted'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
