'use client'

import { DayWithProgress } from '@/types/workshops'
import { CheckCircle2, Circle, PlayCircle, FileText, BookOpen, Link as LinkIcon, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useTopicProgress } from '@/hooks/useTopicProgress'

export default function DayTopicsList({ day, cohortId }: { day: DayWithProgress, cohortId: string }) {
  const { isTopicComplete } = useTopicProgress(cohortId)

  const getTopicMeta = (mediaType: string) => {
    switch (mediaType) {
      case 'video_link': return '5 mins'
      case 'pdf': return '3 mins'
      case 'image': return '1 min'
      default: return '4 mins'
    }
  }

  return (
    <div className="bg-white rounded-[18px] border border-[#ECE0BE] overflow-hidden text-steward-dark w-full max-w-4xl mx-auto shadow-sm font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#ECE0BE] bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-steward-blue text-white flex items-center justify-center">
            <span className="text-sm font-semibold">{day.day_number}</span>
          </div>
          <h2 className="text-[17px] font-bold text-steward-dark uppercase">Day {day.day_number}: {day.title}</h2>
        </div>
        <div className="text-xs text-steward-dark/60 font-black uppercase tracking-widest">
          {day.media?.length || 0} topics
        </div>
      </div>

      {/* Topics List */}
      <div className="flex flex-col">
        {day.media && day.media.length > 0 ? (
          day.media.map((media, index) => {
            const completed = isTopicComplete(media.id)
            const isLast = index === day.media.length - 1

            return (
              <Link 
                key={media.id}
                href={`/hub/pilot-workshops/${cohortId}/day/${day.day_number}/topic/${media.id}`}
                className={`flex items-center justify-between px-6 py-5 hover:bg-[#FEFAE0]/30 transition-colors group cursor-pointer ${
                  !isLast ? 'border-b border-[#ECE0BE]' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {completed ? (
                    <CheckCircle2 className="w-[20px] h-[20px] text-steward-green" />
                  ) : (
                    <Circle className="w-[20px] h-[20px] text-gray-300 group-hover:text-steward-green transition-colors" />
                  )}
                  <span className="text-[15px] font-medium text-steward-dark group-hover:text-steward-blue transition-colors">
                    {media.label || 'Topic Content'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-[12px] text-steward-dark/60 font-medium">
                    {getTopicMeta(media.media_type)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-steward-blue transition-colors" />
                </div>
              </Link>
            )
          })
        ) : (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">
            No topics found for this day.
          </div>
        )}
      </div>
    </div>
  )
}
