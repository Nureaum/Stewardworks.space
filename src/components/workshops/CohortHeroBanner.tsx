'use client'

import { Calendar } from 'lucide-react'
import { DayWithProgress } from '@/types/workshops'
import { useTopicProgress } from '@/hooks/useTopicProgress'
import { useState, useEffect } from 'react'

interface CohortHeroBannerProps {
  cohortName: string
  startDateString: string
  totalDays: number
  days: DayWithProgress[]
  cohortId: string
}

export default function CohortHeroBanner({
  cohortName,
  startDateString,
  totalDays,
  days,
  cohortId
}: CohortHeroBannerProps) {
  const { isTopicComplete } = useTopicProgress(cohortId)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])

  // Calculate completed days correctly using local storage topics
  const completedDays = days.filter(day => {
    const hasTopics = day.media && day.media.length > 0
    const allTopicsCompleted = hasTopics && mounted && day.media!.every(m => isTopicComplete(m.id))
    return allTopicsCompleted || (day.progress?.deliverable_status === 'approved')
  }).length

  const progressPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

  return (
    <div className="relative bg-steward-green rounded-2xl p-7 md:p-8 mb-5 overflow-hidden">
      <div className="absolute -top-11 -right-6 w-36 h-36 rounded-full bg-[#355F40]"></div>
      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 bg-steward-orange text-steward-dark px-3.5 py-1.5 rounded-full text-[11.5px] font-medium mb-4">
          <Calendar className="w-3.5 h-3.5" /> Starts {startDateString}
        </div>
        <div className="text-3xl font-medium text-steward-offwhite mb-2 tracking-tight">{cohortName}</div>
        <p className="text-[13.5px] text-[#DCD7BC] max-w-sm mb-6 leading-relaxed">
          A {totalDays}-day guided path through the fundamentals, at your own pace.
        </p>
        <div className="max-w-[300px]">
          <div className="flex justify-between text-[11.5px] font-medium text-[#DCD7BC] mb-1.5">
            <span>{completedDays} of {totalDays} days complete</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-steward-offwhite/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-steward-orange rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
