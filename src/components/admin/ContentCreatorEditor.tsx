'use client'

import { useState, useEffect } from 'react'
import RichTextEditor from './RichTextEditor'
import toast from 'react-hot-toast'

interface ContentCreatorEditorProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export default function ContentCreatorEditor({
  initialData,
  onSubmit,
  onCancel,
}: ContentCreatorEditorProps) {
  const [sections, setSections] = useState(() => {
    let parsed: any = {};
    if (initialData?.body) {
      try {
        parsed = JSON.parse(initialData.body);
      } catch (e) {
        parsed = { storytelling: initialData.body };
      }
    }
    return {
      storytelling: parsed.storytelling || '',
      monetization: parsed.monetization || '',
      becoming: parsed.becoming || '',
      opportunities: parsed.opportunities || ''
    };
  });
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSectionChange = (key: keyof typeof sections, value: string) => {
    setSections(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Build payload.
      const payload: any = {
        title: 'Content Creator Skills', // Title doesn't matter much here, it's hardcoded on frontend, but good to have
        body: JSON.stringify(sections),
        status: 'published',
        content_type: 'pathways_article',
      }

      await onSubmit(payload)
      toast.success('Content saved successfully!')
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 lg:p-12 space-y-12">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-black text-steward-dark uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
          Storytelling
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-steward-dark focus-within:border-transparent transition-all">
          <RichTextEditor content={sections.storytelling} onChange={(val) => handleSectionChange('storytelling', val)} />
        </div>
        <p className="text-xs text-gray-500 mt-2 font-medium">Tips and guides on how to tell an effective environmental story.</p>
      </div>

      <div>
        <label className="block text-sm font-black text-steward-dark uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
          Monetization Methods
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-steward-dark focus-within:border-transparent transition-all">
          <RichTextEditor content={sections.monetization} onChange={(val) => handleSectionChange('monetization', val)} />
        </div>
        <p className="text-xs text-gray-500 mt-2 font-medium">Information on how creators can monetize their skills.</p>
      </div>

      <div>
        <label className="block text-sm font-black text-steward-dark uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
          Becoming a Content Creator
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-steward-dark focus-within:border-transparent transition-all">
          <RichTextEditor content={sections.becoming} onChange={(val) => handleSectionChange('becoming', val)} />
        </div>
        <p className="text-xs text-gray-500 mt-2 font-medium">Steps and advice on starting out as a content creator.</p>
      </div>

      <div>
        <label className="block text-sm font-black text-steward-dark uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
          Job Opportunities
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-steward-dark focus-within:border-transparent transition-all">
          <RichTextEditor content={sections.opportunities} onChange={(val) => handleSectionChange('opportunities', val)} />
        </div>
        <p className="text-xs text-gray-500 mt-2 font-medium">Relevant job opportunities and career paths in this field.</p>
      </div>

      <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
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
          {isSubmitting ? 'Saving...' : 'Save Content'}
        </button>
      </div>
    </form>
  )
}
