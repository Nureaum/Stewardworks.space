'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HelpdeskCategory, HelpdeskTag } from '@/types/helpdesk'
import { createQuestion } from '@/app/actions/helpdeskActions'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

interface Props {
  categories: HelpdeskCategory[]
  tags: HelpdeskTag[]
}

export default function AskQuestionForm({ categories, tags }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await createQuestion(formData)
      toast.success('Question posted successfully!')
      router.push('/hub/helpdesk')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to post question')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Question Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            placeholder="e.g. How do I format my resume for ATS?"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-steward-green focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-steward-green focus:border-transparent outline-none bg-white"
          >
            <option value="">Select a category...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (Optional)
          </label>
          <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50/50">
            {tags.map(tag => (
              <label key={tag.id} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input type="checkbox" name="tags" value={tag.id} className="rounded text-steward-green focus:ring-steward-green" />
                <span className="text-sm text-gray-700">{tag.name}</span>
              </label>
            ))}
            {tags.length === 0 && <span className="text-sm text-gray-500">No tags available.</span>}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Details
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={8}
            placeholder="Provide all the details needed to answer your question..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-steward-green focus:border-transparent outline-none resize-y"
          ></textarea>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-steward-green hover:bg-steward-orange disabled:opacity-50 rounded-lg transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Post Question
        </button>
      </div>
    </form>
  )
}
