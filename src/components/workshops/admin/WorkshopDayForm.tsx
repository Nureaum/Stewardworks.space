'use client'

import { useState, useEffect } from 'react'
import { WorkshopDayFormProps, CreateWorkshopDayParams, UpdateWorkshopDayParams } from '@/types/workshops'
import RichTextEditor from '@/components/admin/RichTextEditor'
import MediaUploader from './MediaUploader'
import toast from 'react-hot-toast'

export default function WorkshopDayForm({
  cohortId,
  initialData,
  onSubmit,
  onCancel,
}: WorkshopDayFormProps) {
  const [dayNumber, setDayNumber] = useState<1 | 2 | 3>(initialData?.day_number || 1)
  const [title, setTitle] = useState(initialData?.title || '')
  const [contentBody, setContentBody] = useState(initialData?.content_body || '')
  const [deliverableInstructions, setDeliverableInstructions] = useState(
    initialData?.deliverable_instructions || ''
  )
  const [deliverableType, setDeliverableType] = useState<
    'text' | 'file' | 'video' | 'pending_confirmation'
  >(initialData?.deliverable_type || 'pending_confirmation')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Initialize form fields when initialData changes
  useEffect(() => {
    if (initialData) {
      setDayNumber(initialData.day_number)
      setTitle(initialData.title)
      setContentBody(initialData.content_body || '')
      setDeliverableInstructions(initialData.deliverable_instructions || '')
      setDeliverableType(initialData.deliverable_type)
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!title.trim()) {
        throw new Error('Day title is required')
      }

      if (![1, 2, 3].includes(dayNumber)) {
        throw new Error('Day number must be 1, 2, or 3')
      }

      // Build payload
      const payload: CreateWorkshopDayParams | UpdateWorkshopDayParams = {
        cohort_id: cohortId,
        day_number: dayNumber,
        title: title.trim(),
        content_body: contentBody.trim() || null,
        deliverable_instructions: deliverableInstructions.trim() || null,
        deliverable_type: deliverableType,
        requires_admin_approval: false,
      }

      // Add id for update mode
      if (initialData) {
        (payload as UpdateWorkshopDayParams).id = initialData.id
      }

      await onSubmit(payload)
      
      toast.success(
        initialData 
          ? 'Workshop day updated successfully!' 
          : 'Workshop day created successfully!'
      )
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      toast.error(err.message || 'Failed to save workshop day')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 lg:p-12 space-y-8"
    >
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
          {error}
        </div>
      )}

      {/* Day Number */}
      <div>
        <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
          Day Number *
        </label>
        <select
          value={dayNumber}
          onChange={(e) => setDayNumber(parseInt(e.target.value) as 1 | 2 | 3)}
          required
          disabled={!!initialData} // Can't change day number in edit mode
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value={1}>Day 1</option>
          <option value={2}>Day 2</option>
          <option value={3}>Day 3</option>
        </select>
        {initialData && (
          <p className="text-xs text-gray-500 mt-2 font-medium">
            Day number cannot be changed after creation
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
          Day Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
          placeholder="e.g. Introduction to Workshop Concepts"
        />
      </div>

      {/* Content Body - TipTap Editor */}
      <div>
        <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
          Content Body
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
          <RichTextEditor
            content={contentBody}
            onChange={setContentBody}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 font-medium">
          This is the main lesson content that participants will see. Use rich formatting, images, and videos.
        </p>
      </div>

      {/* Deliverable Instructions - TipTap Editor */}
      <div>
        <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
          Deliverable Instructions
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
          <RichTextEditor
            content={deliverableInstructions}
            onChange={setDeliverableInstructions}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 font-medium">
          Explain what participants need to submit to complete this day. Be clear and specific.
        </p>
      </div>

      {/* Deliverable Type */}
      <div>
        <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
          Deliverable Type
        </label>
        <select
          value={deliverableType}
          onChange={(e) => setDeliverableType(e.target.value as 'text' | 'file' | 'video' | 'pending_confirmation')}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
        >
          <option value="pending_confirmation">Pending Confirmation</option>
          <option value="text">Text Submission</option>
          <option value="file">File Upload</option>
          <option value="video">Video (Upload or Link)</option>
        </select>
        <p className="text-xs text-gray-500 mt-2 font-medium">
          This determines what type of submission form participants will see.
        </p>
      </div>



      {/* Media Uploader - Only show in edit mode when day is already created */}
      {initialData && (
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-[11px] font-black text-black uppercase tracking-widest mb-4">
            Day Topics (Videos, Articles, Links)
          </h3>
          <MediaUploader workshopDayId={initialData.id} />
        </div>
      )}

      {/* Audit Info (Edit Mode Only) */}
      {initialData && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Audit Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-bold text-gray-600">Created:</span>
              <span className="text-gray-500 ml-2">
                {new Date(initialData.created_at).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-600">Updated:</span>
              <span className="text-gray-500 ml-2">
                {new Date(initialData.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 mt-12">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-500 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white bg-steward-green rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Workshop Day' : 'Create Workshop Day'}
        </button>
      </div>

      {/* Create day first message */}
      {!initialData && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-4">
          <p className="text-sm text-blue-800 text-center font-bold">
            Note: You will be able to add Topics (Videos, Articles, Links) to this day AFTER you click Create!
          </p>
        </div>
      )}
    </form>
  )
}
