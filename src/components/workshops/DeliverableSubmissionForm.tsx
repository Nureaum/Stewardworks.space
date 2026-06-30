'use client'

import { useState } from 'react'
import { DeliverableSubmissionFormProps, SubmissionData } from '@/types/workshops'
import { Upload, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function DeliverableSubmissionForm({
  dayId,
  deliverableType,
  deliverableInstructions,
  existingSubmission,
  onSubmit,
}: DeliverableSubmissionFormProps) {
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    submission_text: existingSubmission?.submission_text || '',
    external_video_url: existingSubmission?.external_video_url || '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Show notice if deliverable format is pending
  if (deliverableType === 'pending_confirmation') {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-yellow-900">Deliverable Format Being Finalized</h4>
          <p className="text-sm text-yellow-700 mt-1">
            The deliverable format for this day is still being determined. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data: SubmissionData = { ...submissionData }
      
      if (selectedFile) {
        data.file = selectedFile
      }

      await onSubmit(data)
      
      toast.success('Submission Successful!\nYour deliverable has been submitted for review.')

      // Reset form after successful submission
      setSubmissionData({ submission_text: '', external_video_url: '' })
      setSelectedFile(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submission failed'
      toast.error(`Submission Failed\n${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Show existing submission info
  const hasExistingSubmission = existingSubmission && (
    existingSubmission.submission_text ||
    existingSubmission.file_storage_path ||
    existingSubmission.external_video_url
  )

  return (
    <div className="space-y-6">
      {/* Existing submission notice */}
      {hasExistingSubmission && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900">Previous Submission</h4>
          <p className="text-sm text-blue-700 mt-1">
            Submitted on {new Date(existingSubmission.submitted_at).toLocaleString()}
          </p>
          {existingSubmission.submission_text && (
            <p className="text-sm text-blue-800 mt-2 line-clamp-3">
              {existingSubmission.submission_text}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Text submission */}
        {deliverableType === 'text' && (
          <div>
            <label htmlFor="submission_text" className="block text-sm font-medium text-gray-700 mb-2">
              Your Submission
            </label>
            <textarea
              id="submission_text"
              value={submissionData.submission_text}
              onChange={(e) => setSubmissionData({ ...submissionData, submission_text: e.target.value })}
              rows={8}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your response here..."
            />
          </div>
        )}

        {/* File upload */}
        {deliverableType === 'file' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              `}
            >
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
                required={!selectedFile}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-500">
                  PDF, DOC, DOCX, or image files
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Video submission */}
        {deliverableType === 'video' && (
          <div className="space-y-4">
            {/* File upload option */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Video File
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center transition-colors
                  ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                `}
              >
                <input
                  type="file"
                  id="video-upload"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="video-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedFile ? selectedFile.name : 'Upload a video file'}
                  </span>
                </label>
              </div>
            </div>

            {/* OR divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* External video URL */}
            <div>
              <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-2">
                Video URL (YouTube, Loom, etc.)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  id="video_url"
                  value={submissionData.external_video_url}
                  onChange={(e) => setSubmissionData({ ...submissionData, external_video_url: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-500">
            {hasExistingSubmission ? 'Submitting will replace your previous submission' : 'Make sure to review before submitting'}
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Deliverable'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
