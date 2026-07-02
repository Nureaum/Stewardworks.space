'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function SessionEditor({ initialData, onSubmit, onCancel, isEditing }: any) {
  // Parse out title, location, date from the single 'title' field hack
  let initialTitle = ''
  let initialLocation = ''
  let initialDate = ''
  
  if (initialData?.title) {
    const parts = initialData.title.split('|||')
    initialTitle = parts[0] || ''
    initialLocation = parts[1] || ''
    initialDate = parts[2] || ''
  }

  const [title, setTitle] = useState(initialTitle)
  const [location, setLocation] = useState(initialLocation)
  const [date, setDate] = useState(initialDate)
  const [content, setContent] = useState(initialData?.content || '')
  
  const [activeTab, setActiveTab] = useState('summary')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async (status: string) => {
    setIsSubmitting(true)
    const formattedTitle = `${title}|||${location}|||${date}`
    try {
      await onSubmit({
        title: formattedTitle,
        content,
        status,
        content_type: 'community_session',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderTabBtn = (id: string, label: string) => {
    const isActive = activeTab === id
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`px-[18px] py-[8px] rounded-[12px] font-[700] text-[13px] transition-colors border ${
          isActive 
            ? 'bg-[#241c12] text-[#efd9a8] border-[#241c12]' 
            : 'bg-transparent text-[#8a7c66] border-[#785a32]/20 hover:bg-[#785a32]/5'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="bg-white rounded-[22px] p-[30px] shadow-[0_14px_34px_rgba(120,90,50,0.1)] border border-[#785a32]/10 max-w-[960px] w-full">
      <div className="flex items-center gap-[12px] mb-[22px]">
        <button 
          onClick={onCancel}
          className="w-[36px] h-[36px] rounded-[10px] border border-[#785a32]/20 bg-[#fbf5e6] flex items-center justify-center text-[#5c4f3c] hover:bg-[#f2ead2] transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <div className="font-[800] text-[18px] text-[#241c12] leading-none">
            {isEditing ? 'Edit Session' : 'New Session'}
          </div>
          <div className="font-mono text-[10.5px] tracking-[0.16em] text-[#a89a82] mt-[4px] uppercase leading-none">
            {isEditing ? 'UPDATE THIS COMMUNITY LISTENING SESSION' : 'CREATE A NEW COMMUNITY LISTENING SESSION'}
          </div>
        </div>
      </div>

      <div className="flex gap-[8px] mb-[24px] flex-wrap">
        {renderTabBtn('summary', 'Summary')}
        {renderTabBtn('gallery', 'Gallery (Photos)')}
        {renderTabBtn('videos', 'Videos')}
        {renderTabBtn('pdfs', 'PDFs')}
        {renderTabBtn('audio', 'Audio')}
      </div>

      {activeTab === 'summary' && (
        <div className="animate-[ac-fade_0.3s_ease]">
          <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase">SESSION TITLE (E.G. MARCH 19 AT COLLEGE)</label>
          <input 
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter title..." 
            className="w-full mt-[7px] mb-[18px] px-[15px] py-[13px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] text-[14.5px] text-[#241c12] focus:outline-none focus:border-[#785a32]/40"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] mb-[18px]">
            <div>
              <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase">LOCATION</label>
              <input 
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. City Hall, Community Center..." 
                className="w-full mt-[7px] px-[15px] py-[13px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] text-[14.5px] text-[#241c12] focus:outline-none focus:border-[#785a32]/40"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase">EVENT DATE</label>
              <input 
                type="text"
                value={date}
                onChange={e => setDate(e.target.value)}
                placeholder="e.g. Mar 19" 
                className="w-full mt-[7px] px-[15px] py-[13px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] text-[14.5px] text-[#241c12] focus:outline-none focus:border-[#785a32]/40"
              />
            </div>
          </div>

          <label className="block font-mono text-[10px] tracking-[0.18em] text-[#9c8d76] uppercase">CONTENT</label>
          <textarea 
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Summary of what was heard and discussed..." 
            className="w-full mt-[7px] px-[15px] py-[15px] rounded-[11px] border border-[#785a32]/20 bg-[#fdfaf0] text-[14px] text-[#241c12] min-h-[150px] resize-y leading-[1.55] focus:outline-none focus:border-[#785a32]/40"
          />
        </div>
      )}

      {activeTab !== 'summary' && (
        <div className="animate-[ac-fade_0.3s_ease] border-2 border-dashed border-[#785a32]/30 rounded-[16px] p-[52px] text-center bg-[#fdfaf0]">
          <div className="text-[30px] mb-[10px]">⬆</div>
          <div className="font-[700] text-[#5c4f3c] text-[15px]">Drop files here or click to upload</div>
          <div className="text-[12.5px] text-[#a89a82] mt-[5px]">Files attach to this session and appear in the Hub archive.</div>
        </div>
      )}

      <div className="flex justify-end gap-[10px] mt-[24px]">
        <button 
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-[20px] py-[10px] rounded-[12px] border border-[#785a32]/20 bg-transparent text-[#8a7c66] font-[800] text-[13px] hover:bg-[#785a32]/5 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          onClick={() => handleSave('draft')}
          disabled={isSubmitting}
          className="px-[20px] py-[10px] rounded-[12px] border border-[#785a32]/20 bg-[#fdfaf0] text-[#5c4f3c] font-[800] text-[13px] hover:bg-[#f7f0df] transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save as Draft'}
        </button>
        <button 
          onClick={() => handleSave('published')}
          disabled={isSubmitting}
          className="px-[20px] py-[10px] rounded-[12px] border-none bg-[#2f5a37] text-[#e6f5e6] font-[800] text-[13px] hover:bg-[#244a2c] transition-colors shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Publishing...' : 'Publish Content'}
        </button>
      </div>
    </div>
  )
}
