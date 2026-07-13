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
      
      // Convert ISO timestamps to date format
      if (initialData.start_date) {
        const date = new Date(initialData.start_date)
        setStartDate(formatDate(date))
      }
    }
  }, [initialData])

  // Helper function to format date for date input
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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

      let finalDescription = description.trim()
      if (thumbnailUrl.trim()) {
        finalDescription = `${finalDescription}\n<div data-thumbnail="${thumbnailUrl.trim()}" style="display:none;"></div>`
      }

      // Build payload
      const payload: CreateCohortParams | UpdateCohortParams = {
        name: name.trim(),
        description: finalDescription || null,
        start_date: startDateObj.toISOString(),
        registration_opens_at: null,
        registration_closes_at: null,
        capacity: null,
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box' as const,
    background: 'rgba(0,0,0,.4)',
    border: '2px solid #3d2668',
    borderRadius: 8,
    color: '#efe6ff',
    fontSize: 16,
    padding: '14px 16px',
    outline: 'none',
    fontFamily: "'Inter', sans-serif"
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 9,
    color: '#8aa6c4',
    marginBottom: 12,
    letterSpacing: 1,
  }

  const helperStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#9990ab',
    marginTop: 8,
    fontFamily: "'Inter', sans-serif"
  }

  return (
    <div style={{
      background: 'rgba(36,21,66,0.5)',
      border: '2px solid #3d2668',
      borderRadius: 16,
      padding: '40px',
      marginBottom: 24,
    }}>
      <div 
        className="flex justify-between items-center cursor-pointer select-none mb-8 border-b border-[#3d2668] pb-6"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="font-pixel" style={{ fontSize: 16, color: '#c9a85f', letterSpacing: 1 }}>COHORT DETAILS</h2>
          <p style={{ color: '#a493c9', marginTop: 8, fontSize: 15 }}>View and edit cohort settings and registration dates</p>
        </div>
        <button type="button" className="font-pixel" style={{
          padding: '10px 14px',
          background: 'transparent',
          color: '#a493c9',
          border: '2px solid #3d2668',
          borderRadius: 6,
          fontSize: 8,
          cursor: 'pointer'
        }}>
          {isExpanded ? 'HIDE' : 'VIEW'}
        </button>
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="space-y-10">
          {error && (
            <div style={{
              background: 'rgba(255,69,69,0.1)',
              border: '2px dashed #ff4545',
              color: '#ff8888',
              padding: 16,
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "'Press Start 2P', monospace"
            }}>
              {error}
            </div>
          )}

          {/* Cohort Name */}
          <div>
            <label style={labelStyle}>COHORT NAME *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
              placeholder="e.g. Spring 2024 Cohort"
            />
          </div>

          {/* Thumbnail URL */}
          <div>
            <label style={labelStyle}>THUMBNAIL IMAGE</label>
            {thumbnailUrl ? (
              <div className="relative inline-block border-2 border-[#3d2668] rounded-xl overflow-hidden">
                <img src={thumbnailUrl} alt="Thumbnail Preview" className="h-40 object-cover" />
                <button 
                  type="button" 
                  onClick={() => setThumbnailUrl('')}
                  className="absolute top-2 right-2 flex items-center justify-center"
                  style={{
                    background: '#ff4545',
                    color: '#06040c',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '2px solid #14101f',
                    cursor: 'pointer'
                  }}
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
                className="w-full"
                style={{
                  color: '#efe6ff',
                  fontFamily: "'Inter', sans-serif"
                }}
              />
            )}
            <p style={helperStyle}>Optional: Upload an image to display on the cohort card.</p>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Brief description of this cohort..."
            />
            <p style={helperStyle}>This description will be visible to participants on the public cohort listing.</p>
          </div>

          {/* Start Date */}
          <div>
            <label style={labelStyle}>START DATE *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={inputStyle}
            />
            <p style={helperStyle}>Day 1 will automatically unlock for registered participants when this date arrives.</p>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>STATUS</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'open' | 'closed' | 'completed')}
              style={inputStyle}
            >
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="completed">Completed</option>
            </select>
            <p style={helperStyle}>Only cohorts with "Open" status are visible to participants on the public page.</p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-10 border-t border-[#3d2668] mt-12">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="font-pixel"
              style={{
                padding: '14px 24px',
                fontSize: 10,
                background: 'transparent',
                color: '#a493c9',
                border: '2px solid #3d2668',
                borderRadius: 8,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="font-pixel"
              style={{
                padding: '14px 24px',
                fontSize: 10,
                background: '#45d6ff',
                color: '#06040c',
                border: 'none',
                borderRadius: 8,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                fontWeight: 'bold',
                boxShadow: '0 0 16px rgba(69,214,255,0.2)'
              }}
            >
              {isSubmitting ? 'SAVING...' : initialData ? 'UPDATE COHORT' : 'CREATE COHORT'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
