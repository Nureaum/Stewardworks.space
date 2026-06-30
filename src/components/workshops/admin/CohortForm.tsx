'use client'

import { useState, useEffect } from 'react'
import { CohortFormProps, CreateCohortParams, UpdateCohortParams } from '@/types/workshops'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import { uploadCohortThumbnail } from '@/app/actions/workshops/cohorts'


export default function CohortForm({
  initialData,
  onSubmit,
  onCancel,
}: CohortFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [startDate, setStartDate] = useState('')
  const [registrationOpensAt, setRegistrationOpensAt] = useState('')
  const [registrationClosesAt, setRegistrationClosesAt] = useState('')
  const [capacity, setCapacity] = useState<string>('')
  const [status, setStatus] = useState<'draft' | 'open' | 'closed' | 'completed'>(
    initialData?.status || 'draft'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isExpanded, setIsExpanded] = useState(!initialData)

  const extractThumbnail = (desc: string) => {
    const match = desc.match(/<div data-thumbnail="(.*?)" style="display:none;"><\/div>/)
    if (match) {
      return {
        thumbnail: match[1],
        description: desc.replace(match[0], '').trim()
      }
    }
    return { thumbnail: '', description: desc }
  }

  // Initialize form fields when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      
      const { thumbnail, description: cleanDesc } = extractThumbnail(initialData.description || '')
      setDescription(cleanDesc)
      setThumbnailUrl(thumbnail)
      
      setStatus(initialData.status)
      
      // Convert ISO timestamps to datetime-local format
      if (initialData.start_date) {
        const date = new Date(initialData.start_date)
        setStartDate(formatDateTimeLocal(date))
      }
      
      if (initialData.registration_opens_at) {
        const date = new Date(initialData.registration_opens_at)
        setRegistrationOpensAt(formatDateTimeLocal(date))
      }
      
      if (initialData.registration_closes_at) {
        const date = new Date(initialData.registration_closes_at)
        setRegistrationClosesAt(formatDateTimeLocal(date))
      }
      
      if (initialData.capacity !== null) {
        setCapacity(initialData.capacity.toString())
      }
    }
  }, [initialData])

  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Validate dates
      if (!startDate) {
        throw new Error('Start date is required')
      }

      const startDateObj = new Date(startDate)
      
      // Validate registration window if provided
      if (registrationOpensAt && registrationClosesAt) {
        const opensAt = new Date(registrationOpensAt)
        const closesAt = new Date(registrationClosesAt)
        
        if (closesAt <= opensAt) {
          throw new Error('Registration close date must be after open date')
        }
        
        if (closesAt > startDateObj) {
          throw new Error('Registration must close before the cohort starts')
        }
      }

      let finalDescription = description.trim()
      if (thumbnailUrl.trim()) {
        finalDescription = `${finalDescription}\n<div data-thumbnail="${thumbnailUrl.trim()}" style="display:none;"></div>`
      }

      // Build payload
      const payload: CreateCohortParams | UpdateCohortParams = {
        name: name.trim(),
        description: finalDescription || null,
        start_date: startDateObj.toISOString(),
        registration_opens_at: registrationOpensAt 
          ? new Date(registrationOpensAt).toISOString() 
          : null,
        registration_closes_at: registrationClosesAt 
          ? new Date(registrationClosesAt).toISOString() 
          : null,
        capacity: capacity ? parseInt(capacity, 10) : null,
        status,
      }

      // Add id for update mode
      if (initialData) {
        (payload as UpdateCohortParams).id = initialData.id
      }

      await onSubmit(payload)
      
      toast.success(
        initialData 
          ? 'Cohort updated successfully!' 
          : 'Cohort created successfully!'
      )
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      toast.error(err.message || 'Failed to save cohort')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 lg:p-12 mb-8">
      <div 
        className="flex justify-between items-center cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-2xl font-black text-steward-dark">Cohort Details</h2>
          <p className="text-gray-500 font-medium mt-1">View and edit cohort settings and registration dates</p>
        </div>
        <button type="button" className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors font-bold text-sm text-steward-dark border border-gray-200">
          {isExpanded ? 'Hide Details' : 'View Details'}
        </button>
      </div>

      {isExpanded && (
        <form 
          onSubmit={handleSubmit} 
          className="pt-8 border-t border-gray-100 space-y-8 mt-6"
        >
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

      {/* Cohort Name */}
      <div>
        <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
          Cohort Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
          placeholder="e.g. Spring 2024 Cohort"
        />
      </div>

      {/* Thumbnail URL */}
      <div>
        <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
          Thumbnail Image
        </label>
        {thumbnailUrl ? (
          <div className="relative inline-block border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <img src={thumbnailUrl} alt="Thumbnail Preview" className="h-32 object-cover" />
            <button 
              type="button" 
              onClick={() => setThumbnailUrl('')}
              className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1.5 shadow-md border border-gray-200 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                toast.loading('Uploading image...', { id: 'upload-thumb' })
                const formData = new FormData()
                formData.append('file', file)
                const url = await uploadCohortThumbnail(formData)
                setThumbnailUrl(url)
                toast.success('Image uploaded successfully!', { id: 'upload-thumb' })
              } catch (err: any) {
                toast.error(err.message, { id: 'upload-thumb' })
              }
            }}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-steward-blue file:text-white hover:file:bg-steward-dark cursor-pointer"
          />
        )}
        <p className="text-xs text-gray-500 mt-2 font-medium">
          Optional: Upload an image to display on the cohort card.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-medium text-steward-dark resize-none"
          placeholder="Brief description of this cohort..."
        />
        <p className="text-xs text-gray-500 mt-2 font-medium">
          This description will be visible to participants on the public cohort listing.
        </p>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
          Start Date *
        </label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
        />
        <p className="text-xs text-gray-500 mt-2 font-medium">
          Day 1 will automatically unlock for registered participants when this date arrives.
        </p>
      </div>

      {/* Registration Window */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
            Registration Opens At
          </label>
          <input
            type="datetime-local"
            value={registrationOpensAt}
            onChange={(e) => setRegistrationOpensAt(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
          />
          <p className="text-xs text-gray-500 mt-2 font-medium">
            Optional: When registration becomes available
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
            Registration Closes At
          </label>
          <input
            type="datetime-local"
            value={registrationClosesAt}
            onChange={(e) => setRegistrationClosesAt(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
          />
          <p className="text-xs text-gray-500 mt-2 font-medium">
            Optional: When registration closes
          </p>
        </div>
      </div>

      {/* Capacity */}
      <div>
        <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
          Capacity
        </label>
        <input
          type="number"
          min="1"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
          placeholder="Leave empty for unlimited"
        />
        <p className="text-xs text-gray-500 mt-2 font-medium">
          Maximum number of participants. When reached, new registrations will be waitlisted. Leave empty for no limit.
        </p>
      </div>

      {/* Status */}
      <div>
        <label className="block text-[11px] font-black text-black uppercase tracking-widest mb-2">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'draft' | 'open' | 'closed' | 'completed')}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark focus:bg-white transition-all font-bold text-steward-dark"
        >
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="completed">Completed</option>
        </select>
        <p className="text-xs text-gray-500 mt-2 font-medium">
          Only cohorts with "Open" status are visible to participants on the public page.
        </p>
      </div>

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
          {isSubmitting ? 'Saving...' : initialData ? 'Update Cohort' : 'Create Cohort'}
        </button>
      </div>
    </form>
    )}
    </div>
  )
}
