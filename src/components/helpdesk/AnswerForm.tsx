'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAnswer } from '@/app/actions/helpdeskAnswers'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

interface Props {
  questionId: string
}

export default function AnswerForm({ questionId }: Props) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      await createAnswer(questionId, content)
      toast.success('Answer posted successfully!')
      setContent('')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to post answer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Provide an Answer</h3>
      <textarea
        required
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-steward-green focus:border-transparent outline-none resize-y mb-4"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-steward-green hover:bg-steward-orange disabled:opacity-50 rounded-lg transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Post Answer
        </button>
      </div>
    </form>
  )
}
