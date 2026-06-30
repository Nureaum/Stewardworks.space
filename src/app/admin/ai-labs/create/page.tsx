'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCohorts } from '@/app/actions/workshops/cohorts'
import { createAILab } from '@/app/actions/ai-labs'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { Cohort } from '@/types/workshops'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CreateAILabPage() {
  const router = useRouter()
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [title, setTitle] = useState('')
  const [cohortId, setCohortId] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    async function loadCohorts() {
      try {
        const data = await getCohorts()
        setCohorts(data)
      } catch (error) {
        toast.error('Failed to load cohorts')
      } finally {
        setLoading(false)
      }
    }
    loadCohorts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !cohortId || !content) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      await createAILab({
        title,
        cohort_id: cohortId,
        content
      })
      toast.success('AI Lab created successfully')
      router.push('/admin/ai-labs')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create AI Lab')
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/admin/ai-labs" className="inline-flex items-center gap-2 text-steward-dark/60 hover:text-steward-dark mb-6 font-bold uppercase tracking-widest text-sm">
        <ArrowLeft size={20} /> Back to AI Labs
      </Link>
      
      <h1 className="text-3xl font-black text-steward-dark uppercase tracking-widest mb-8">Create AI Lab</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-xl border-2 border-steward-dark/5">
        <div>
          <label className="block text-sm font-black uppercase tracking-widest text-steward-dark mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-steward-gold focus:ring-0 transition-colors"
            placeholder="e.g. Prompt Engineering Basics"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-black uppercase tracking-widest text-steward-dark mb-2">Workshop (Cohort)</label>
          <select
            value={cohortId}
            onChange={e => setCohortId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-steward-gold focus:ring-0 transition-colors"
            required
          >
            <option value="">Select a Workshop...</option>
            {cohorts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-black uppercase tracking-widest text-steward-dark mb-2">Content</label>
          <div className="border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-steward-gold transition-colors">
            <RichTextEditor
              content={content}
              onChange={setContent}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t-2 border-gray-100">
          <Link
            href="/admin/ai-labs"
            className="px-8 py-3 border-2 border-gray-200 rounded-xl text-steward-dark hover:bg-gray-50 font-bold uppercase tracking-widest text-sm transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-steward-dark hover:bg-black text-white rounded-xl font-bold uppercase tracking-widest text-sm disabled:opacity-50 transition-colors shadow-lg"
          >
            {submitting ? 'Saving...' : 'Save AI Lab'}
          </button>
        </div>
      </form>
    </div>
  )
}
