'use client'

import { WorkshopDayMedia } from '@/types/workshops'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTopicProgress } from '@/hooks/useTopicProgress'
import { markDayProgressApproved } from '@/app/actions/workshops/participants'

export default function TopicViewer({ 
  media, 
  cohortId, 
  dayNumber,
  dayTitle,
  dayId,
  dayMediaIds
}: { 
  media: WorkshopDayMedia, 
  cohortId: string, 
  dayNumber: number,
  dayTitle: string,
  dayId: string,
  dayMediaIds: string[]
}) {
  const router = useRouter()
  const { markTopicComplete, isTopicComplete, completedTopics } = useTopicProgress(cohortId)
  const isCompleted = isTopicComplete(media.id)

  const handleMarkComplete = async () => {
    console.log('[TopicViewer] handleMarkComplete clicked for media:', media.id)
    // 1. Mark topic complete in local storage
    markTopicComplete(media.id)
    
    // 2. Check if this completes the entire day (including this just-marked topic)
    const allTopicsCurrentlyCompleted = completedTopics.filter(t => dayMediaIds.includes(t))
    console.log('[TopicViewer] dayMediaIds:', dayMediaIds)
    console.log('[TopicViewer] completedTopics currently:', completedTopics)
    
    // If the currently completed topics + this new one equals all topics for the day
    const willBeComplete = dayMediaIds.every(id => 
      id === media.id || completedTopics.includes(id)
    )
    console.log('[TopicViewer] willBeComplete:', willBeComplete)

    if (willBeComplete) {
      console.log('[TopicViewer] Calling markDayProgressApproved for dayId:', dayId)
      // 3. Sync to backend so Day 2 unlocks!
      const success = await markDayProgressApproved(dayId, cohortId)
      console.log('[TopicViewer] markDayProgressApproved result:', success)
    }

    // 4. Return to the day view
    router.push(`/hub/pilot-workshops/${cohortId}/day/${dayNumber}`)
  }

  const renderContent = () => {
    if (media.media_type === 'image' && media.url) {
      return (
        <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <img src={media.url} alt={media.label || 'Topic image'} className="w-full h-auto" />
        </div>
      )
    }

    if (media.media_type === 'video_link' && media.url) {
      const getEmbedUrl = (url: string) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const videoId = url.includes('youtu.be') ? url.split('youtu.be/')[1]?.split('?')[0] : new URL(url).searchParams.get('v')
          return videoId ? `https://www.youtube.com/embed/${videoId}` : url
        }
        if (url.includes('vimeo.com')) {
          const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
          return videoId ? `https://player.vimeo.com/video/${videoId}` : url
        }
        return url
      }

      return (
        <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 aspect-video">
          <iframe
            src={getEmbedUrl(media.url)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    if (media.media_type === 'external_link' && media.url?.startsWith('internal_html:')) {
      const htmlContent = media.url.replace('internal_html:', '')
      return (
        <div 
          className="prose prose-lg max-w-none text-gray-800 bg-white p-8 rounded-xl shadow-sm border border-gray-100"
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      )
    }

    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <h3 className="text-xl font-semibold mb-4">External Resource</h3>
        <a 
          href={media.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-steward-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Resource
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-steward-offwhite py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/hub/pilot-workshops/${cohortId}/day/${dayNumber}`}
            className="inline-flex items-center gap-2 text-sm text-steward-dark hover:opacity-80 transition-opacity font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Day {dayNumber}
          </Link>
          
          <div className="text-sm font-black text-steward-dark/60 uppercase tracking-widest">
            Day {dayNumber}: {dayTitle}
          </div>
        </div>

        {/* Content Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-steward-dark mb-2 tracking-tight uppercase">
            {media.label || 'Topic Details'}
          </h1>
        </div>

        {/* The Content */}
        <div className="mb-12">
          {renderContent()}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[18px] border border-[#ECE0BE] shadow-sm">
          <p className="text-[15px] font-medium text-steward-dark/70">
            Finished reviewing this material?
          </p>
          <button
            onClick={handleMarkComplete}
            className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-sm ${
              isCompleted 
                ? 'bg-steward-green text-steward-offwhite hover:opacity-90' 
                : 'bg-steward-blue text-white hover:opacity-90 hover:scale-[1.02]'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Return to Day {dayNumber}
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Mark Complete
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
