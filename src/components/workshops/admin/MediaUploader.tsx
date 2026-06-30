'use client'

import { useState, useRef, useEffect } from 'react'
import { WorkshopDayMedia } from '@/types/workshops'
import { Upload, Link as LinkIcon, Video, FileText, Image as ImageIcon, ExternalLink, X, GripVertical, AlignLeft } from 'lucide-react'
import RichTextEditor from '@/components/admin/RichTextEditor'
import toast from 'react-hot-toast'
import { 
  uploadDayMedia, 
  addExternalMedia, 
  deleteDayMedia, 
  updateMediaSortOrder,
  getWorkshopDays
} from '@/app/actions/workshops/workshop-days'

interface MediaUploaderProps {
  workshopDayId: string
}

export default function MediaUploader({ workshopDayId }: MediaUploaderProps) {
  const [media, setMedia] = useState<WorkshopDayMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [linkType, setLinkType] = useState<'video_link' | 'external_link' | 'file' | 'text_content'>('text_content')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  // Load existing media
  useEffect(() => {
    loadMedia()
  }, [workshopDayId])

  const loadMedia = async () => {
    try {
      setIsLoading(true)
      // We need to get the cohort_id first to use getWorkshopDays
      // For now, we'll fetch directly from the API
      const response = await fetch(`/api/admin/workshop-days/${workshopDayId}/media`)
      if (response.ok) {
        const data = await response.json()
        setMedia(data.media || [])
      }
    } catch (error) {
      console.error('Failed to load media:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    const loadingToast = toast.loading('Uploading file...')

    try {
      // Determine media type based on file type
      const mediaType = file.type.startsWith('image/') ? 'image' : 'pdf'
      
      const result = await uploadDayMedia(workshopDayId, file, mediaType)
      
      // Add to local state
      setMedia(prev => [...prev, result])
      
      toast.success('File uploaded successfully!', { id: loadingToast })
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file', { id: loadingToast })
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAddLink = async () => {
    let finalUrl = linkUrl
    let finalType = linkType

    if (linkType === 'text_content') {
      if (!textContent.trim() || textContent === '<p></p>') {
        toast.error('Please enter some content')
        return
      }
      finalUrl = `internal_html:${textContent}`
      finalType = 'external_link' // Save as external link to pass DB constraints
    } else if (!linkUrl.trim()) {
      toast.error('Please enter a URL')
      return
    }

    const loadingToast = toast.loading('Adding topic...')

    try {
      const result = await addExternalMedia(
        workshopDayId,
        finalUrl,
        finalType as 'video_link' | 'external_link',
        linkLabel || undefined
      )
      
      // Add to local state
      setMedia(prev => [...prev, result])
      
      // Reset form
      setLinkUrl('')
      setLinkLabel('')
      setTextContent('')
      setShowLinkForm(false)
      
      toast.success('Topic added successfully!', { id: loadingToast })
    } catch (error: any) {
      toast.error(error.message || 'Failed to add topic', { id: loadingToast })
    }
  }

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media item?')) {
      return
    }

    const loadingToast = toast.loading('Deleting...')

    try {
      await deleteDayMedia(mediaId)
      
      // Remove from local state
      setMedia(prev => prev.filter(m => m.id !== mediaId))
      
      toast.success('Media deleted successfully!', { id: loadingToast })
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete media', { id: loadingToast })
    }
  }

  const handleDragStart = (e: React.DragEvent, mediaId: string) => {
    setDraggedItem(mediaId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetMediaId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetMediaId) {
      setDraggedItem(null)
      return
    }

    const draggedIndex = media.findIndex(m => m.id === draggedItem)
    const targetIndex = media.findIndex(m => m.id === targetMediaId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Reorder locally
    const newMedia = [...media]
    const [removed] = newMedia.splice(draggedIndex, 1)
    newMedia.splice(targetIndex, 0, removed)

    // Update sort orders
    const updatedMedia = newMedia.map((item, index) => ({
      ...item,
      sort_order: index
    }))

    setMedia(updatedMedia)
    setDraggedItem(null)

    // Update on server
    try {
      await updateMediaSortOrder(
        workshopDayId,
        updatedMedia.map(m => ({ id: m.id, sort_order: m.sort_order }))
      )
      toast.success('Media order updated')
    } catch (error: any) {
      toast.error('Failed to update order')
      // Reload media to restore correct order
      loadMedia()
    }
  }

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'pdf':
        return <FileText size={20} className="text-red-500" />
      case 'image':
        return <ImageIcon size={20} className="text-blue-500" />
      case 'video_link':
        return <Video size={20} className="text-purple-500" />
      case 'external_link':
        return <ExternalLink size={20} className="text-green-500" />
      default:
        return <FileText size={20} className="text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-steward-green"></div>
        <p className="text-sm text-gray-500 mt-2 font-medium">Loading media...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Controls */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowLinkForm(!showLinkForm)}
          className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-steward-dark rounded-xl hover:bg-gray-800 transition-colors shadow-md"
        >
          <Upload size={16} />
          Add New Topic
        </button>
      </div>

      {/* Add Topic Form */}
      {showLinkForm && (
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <h4 className="font-black text-steward-dark text-lg mb-2">Create New Topic</h4>
          
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">
              Topic Title *
            </label>
            <input
              type="text"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="e.g. 'Coaching Tips: Job Success Score'"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark text-sm font-bold text-steward-dark"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">
              Content Type
            </label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as 'video_link' | 'external_link' | 'file' | 'text_content')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark text-sm font-bold text-steward-dark"
            >
              <option value="text_content">Rich Text Article (Write Content)</option>
              <option value="video_link">Video (YouTube/Vimeo Link)</option>
              <option value="external_link">External Link (Webpage)</option>
              <option value="file">Document (Upload PDF/Image)</option>
            </select>
          </div>

          {linkType === 'file' ? (
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">
                Upload File *
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.pdf"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark text-sm font-medium"
              />
            </div>
          ) : linkType === 'text_content' ? (
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">
                Article Body *
              </label>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <RichTextEditor
                  content={textContent}
                  onChange={setTextContent}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">
                URL *
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-steward-dark text-sm font-bold text-steward-dark"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setShowLinkForm(false)
                setLinkUrl('')
                setLinkLabel('')
                setLinkType('video_link')
              }}
              className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-gray-500 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={uploadingFile}
              onClick={linkType === 'file' ? () => handleFileSelect({ target: { files: fileInputRef.current?.files } } as any) : handleAddLink}
              className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-steward-green rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {uploadingFile ? 'Saving...' : 'Save Topic'}
            </button>
          </div>
        </div>
      )}

      {/* Media List */}
      {media.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {media.length} Media Item{media.length !== 1 ? 's' : ''} · Drag to reorder
          </p>
          
          <div className="space-y-2">
            {media.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item.id)}
                className={`flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-move ${
                  draggedItem === item.id ? 'opacity-50' : ''
                }`}
              >
                <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
                
                <div className="flex-shrink-0">
                  {getMediaIcon(item.media_type)}
                </div>

                <div className="flex-1 min-w-0">
                  {item.label && (
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {item.label}
                    </p>
                  )}
                  {item.url?.startsWith('internal_html:') ? (
                    <p className="text-xs text-gray-500 truncate font-medium italic">
                      [Rich Text Content]
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 truncate font-medium">
                      {item.url}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">
                    {item.url?.startsWith('internal_html:') ? 'Internal Article' : item.media_type.replace('_', ' ')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
          <ImageIcon size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500 font-medium">
            No topics added yet
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Click 'Add New Topic' to build your curriculum with videos, articles, and documents
          </p>
        </div>
      )}
    </div>
  )
}
