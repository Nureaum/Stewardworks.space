'use client'

import { useState, useEffect } from 'react'
import { DeliverableReviewCardProps } from '@/types/workshops'
import { CheckCircle, XCircle, Calendar, User, FileText, Link as LinkIcon, Video, Download, FileIcon, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DeliverableReviewCard({
  submission,
  progressId,
  onReview,
}: DeliverableReviewCardProps) {
  const [isReviewing, setIsReviewing] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [filePublicUrl, setFilePublicUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'other' | null>(null)

  // Construct public URL for file storage path
  useEffect(() => {
    if (submission.file_storage_path) {
      // Construct public URL from Supabase storage path
      // Format: https://{PROJECT_REF}.supabase.co/storage/v1/object/public/{BUCKET_NAME}/{FILE_PATH}
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/workshop-media/${submission.file_storage_path}`
      setFilePublicUrl(publicUrl)
      
      // Determine file type from extension
      const extension = submission.file_storage_path.split('.').pop()?.toLowerCase()
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
        setFileType('image')
      } else if (extension === 'pdf') {
        setFileType('pdf')
      } else {
        setFileType('other')
      }
    }
  }, [submission.file_storage_path])

  const handleApprove = async () => {
    setIsReviewing(true)
    try {
      await onReview('approved')
      toast.success('Deliverable approved successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve deliverable')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleReject = async () => {
    setIsReviewing(true)
    try {
      await onReview('rejected', reviewNote.trim() || undefined)
      toast.success('Deliverable rejected with feedback')
      setShowRejectModal(false)
      setReviewNote('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject deliverable')
    } finally {
      setIsReviewing(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <>
      <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-black text-steward-dark">
              {submission.day_title}
            </h3>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <User className="w-4 h-4" />
                <span className="font-bold">{submission.participant_name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{formatDate(submission.submitted_at)}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {submission.participant_email}
            </div>
          </div>

          {/* Day Number Badge */}
          <div className="flex-shrink-0">
            <div className="bg-steward-green text-white rounded-full w-12 h-12 flex items-center justify-center font-black text-lg">
              {submission.day_number}
            </div>
          </div>
        </div>

        {/* Status Badge - Show if already reviewed */}
        {submission.deliverable_status !== 'submitted' && (
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border-2 bg-gray-50">
            <div className="flex items-center gap-3">
              {submission.deliverable_status === 'approved' ? (
                <>
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-green-700 uppercase tracking-widest">
                      Approved
                    </p>
                    <p className="text-xs text-gray-600 font-medium">
                      This deliverable has been approved
                    </p>
                  </div>
                </>
              ) : submission.deliverable_status === 'rejected' ? (
                <>
                  <div className="p-2 bg-red-100 rounded-full">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-red-700 uppercase tracking-widest">
                      Rejected
                    </p>
                    <p className="text-xs text-gray-600 font-medium">
                      This deliverable needs improvement
                    </p>
                    {submission.review_note && (
                      <div className="mt-2 p-3 bg-white rounded-lg border border-red-200">
                        <p className="text-xs font-bold text-gray-700 mb-1">Feedback:</p>
                        <p className="text-xs text-gray-600 font-medium">{submission.review_note}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}


        {/* Submission Content */}
        <div className="space-y-4">
          <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
            Submission
          </div>

          {/* Text Submission */}
          {submission.submission_text && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-bold text-gray-700">Text Submission</span>
              </div>
              <div className="max-h-48 sm:max-h-64 lg:max-h-96 overflow-y-auto text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                {submission.submission_text}
              </div>
            </div>
          )}

          {/* File Submission */}
          {submission.file_storage_path && filePublicUrl && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-bold text-gray-700">File Submission</span>
              </div>
              
              {/* Image Preview */}
              {fileType === 'image' && (
                <div className="space-y-3">
                  <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                    <img
                      src={filePublicUrl}
                      alt="Submitted file"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                  <a
                    href={filePublicUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-steward-dark text-steward-dark rounded-xl hover:bg-steward-dark hover:text-white transition-colors text-sm font-bold"
                  >
                    <Download className="w-4 h-4" />
                    Download Image
                  </a>
                </div>
              )}
              
              {/* PDF Preview */}
              {fileType === 'pdf' && (
                <div className="space-y-3">
                  <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                    <iframe
                      src={filePublicUrl}
                      className="w-full h-[600px]"
                      title="PDF Preview"
                    />
                  </div>
                  <a
                    href={filePublicUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-steward-dark text-steward-dark rounded-xl hover:bg-steward-dark hover:text-white transition-colors text-sm font-bold"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </a>
                </div>
              )}
              
              {/* Other File Types - Download Only */}
              {fileType === 'other' && (
                <a
                  href={filePublicUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-steward-dark text-steward-dark rounded-xl hover:bg-steward-dark hover:text-white transition-colors text-sm font-bold"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </a>
              )}
            </div>
          )}

          {/* Video URL Submission */}
          {submission.external_video_url && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Video className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-bold text-gray-700">Video Submission</span>
              </div>
              {/* Check if it's a YouTube URL and embed if possible */}
              {submission.external_video_url.includes('youtube.com') || 
               submission.external_video_url.includes('youtu.be') ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={getYouTubeEmbedUrl(submission.external_video_url)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : (
                <a
                  href={submission.external_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-steward-dark text-steward-dark rounded-xl hover:bg-steward-dark hover:text-white transition-colors text-sm font-bold break-all"
                >
                  <LinkIcon className="w-4 h-4 flex-shrink-0" />
                  {submission.external_video_url}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Review Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isReviewing || submission.deliverable_status !== 'submitted'}
            className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-red-600 bg-white border-2 border-red-600 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={isReviewing || submission.deliverable_status !== 'submitted'}
            className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white bg-steward-green rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isReviewing ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-steward-dark">
                Reject Deliverable
              </h3>
            </div>

            <div>
              <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
                Feedback for Participant (Optional)
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-medium text-steward-dark resize-none"
                placeholder="Explain what needs to be improved..."
              />
              <p className="text-xs text-gray-500 mt-2 font-medium">
                This feedback will be visible to the participant so they can improve their submission.
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setReviewNote('')
                }}
                disabled={isReviewing}
                className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isReviewing}
                className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isReviewing ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Helper function to convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url: string): string {
  // Handle youtu.be short links
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1].split('?')[0]
    return `https://www.youtube.com/embed/${videoId}`
  }
  
  // Handle youtube.com watch links
  if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1])
    const videoId = urlParams.get('v')
    return `https://www.youtube.com/embed/${videoId}`
  }
  
  // If already an embed URL, return as is
  if (url.includes('youtube.com/embed/')) {
    return url
  }
  
  // Fallback
  return url
}
