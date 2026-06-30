'use client'

import { DayContentProps } from '@/types/workshops'
import { FileText, Video, ExternalLink, Image as ImageIcon, Download } from 'lucide-react'

export default function DayContent({ day, cohortId }: DayContentProps) {
  return (
    <div className="space-y-6">
      {/* Main content body */}
      {day.content_body && (
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: day.content_body }}
        />
      )}

      {/* Media attachments */}
      {day.media && day.media.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {day.media.map((media) => (
              <MediaItem key={media.id} media={media} />
            ))}
          </div>
        </div>
      )}

      {/* Deliverable instructions */}
      {day.deliverable_instructions && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Deliverable Instructions
          </h3>
          <div 
            className="text-sm text-blue-800"
            dangerouslySetInnerHTML={{ __html: day.deliverable_instructions }}
          />
        </div>
      )}
    </div>
  )
}

interface MediaItemProps {
  media: DayContentProps['day']['media'][0]
}

function MediaItem({ media }: MediaItemProps) {
  const getIcon = () => {
    switch (media.media_type) {
      case 'pdf':
        return <FileText className="w-5 h-5" />
      case 'video_link':
        return <Video className="w-5 h-5" />
      case 'image':
        return <ImageIcon className="w-5 h-5" />
      case 'external_link':
        return <ExternalLink className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getColor = () => {
    switch (media.media_type) {
      case 'pdf':
        return 'bg-red-50 text-red-600 border-red-200'
      case 'video_link':
        return 'bg-purple-50 text-purple-600 border-purple-200'
      case 'image':
        return 'bg-green-50 text-green-600 border-green-200'
      case 'external_link':
        return 'bg-blue-50 text-blue-600 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  // Render based on media type
  if (media.media_type === 'image' && media.url) {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <img 
          src={media.url} 
          alt={media.label || 'Workshop image'} 
          className="w-full h-48 object-cover"
        />
        {media.label && (
          <div className="p-3 bg-gray-50">
            <p className="text-sm font-medium text-gray-900">{media.label}</p>
          </div>
        )}
      </div>
    )
  }

  if (media.media_type === 'video_link' && media.url) {
    // Extract video ID for embeds
    const getEmbedUrl = (url: string) => {
      // YouTube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtu.be') 
          ? url.split('youtu.be/')[1]?.split('?')[0]
          : new URL(url).searchParams.get('v')
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url
      }
      // Vimeo
      if (url.includes('vimeo.com')) {
        const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
        return videoId ? `https://player.vimeo.com/video/${videoId}` : url
      }
      return url
    }

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="aspect-video">
          <iframe
            src={getEmbedUrl(media.url)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {media.label && (
          <div className="p-3 bg-gray-50">
            <p className="text-sm font-medium text-gray-900">{media.label}</p>
          </div>
        )}
      </div>
    )
  }

  // Handle internal HTML articles (saved as external_link but prefixed with internal_html:)
  if (media.media_type === 'external_link' && media.url?.startsWith('internal_html:')) {
    const htmlContent = media.url.replace('internal_html:', '')
    return (
      <div className="border border-gray-200 rounded-lg p-6 bg-white col-span-full">
        {media.label && <h4 className="text-xl font-bold mb-4 text-gray-900">{media.label}</h4>}
        <div 
          className="prose prose-sm max-w-none text-gray-800"
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
      </div>
    )
  }

  // Default card for PDF and standard external links
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        flex items-center gap-3 p-4 border rounded-lg transition-all hover:shadow-md
        ${getColor()}
      `}
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {media.label || 'View Resource'}
        </p>
        <p className="text-xs opacity-75 truncate">
          {media.media_type === 'pdf' ? 'PDF Document' : 'External Link'}
        </p>
      </div>
      {media.media_type === 'pdf' && (
        <Download className="w-4 h-4 flex-shrink-0" />
      )}
      {media.media_type === 'external_link' && (
        <ExternalLink className="w-4 h-4 flex-shrink-0" />
      )}
    </a>
  )
}
