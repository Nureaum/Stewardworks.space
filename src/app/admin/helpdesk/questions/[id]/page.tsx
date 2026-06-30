import { getQuestionById } from '@/app/actions/helpdeskActions'
import { answerQuestion } from '@/app/actions/helpdeskAdmin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Admin - Answer Question'
}

export default async function AdminAnswerQuestionPage({ params }: { params: { id: string } }) {
  const question = await getQuestionById(params.id)

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Question Not Found</h1>
        <Link href="/admin/helpdesk" className="text-steward-green hover:underline">
          Return to Help Desk Admin
        </Link>
      </div>
    )
  }

  const handleAnswerSubmit = async (formData: FormData) => {
    'use server'
    const content = formData.get('content') as string
    const isFaq = formData.get('isFaq') === 'on'
    
    if (content) {
      await answerQuestion(params.id, content, isFaq)
      revalidatePath(`/hub/helpdesk/${params.id}`)
      revalidatePath('/admin/helpdesk')
      redirect('/admin/helpdesk')
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Link href="/admin/helpdesk" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Questions List
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-gray-100 p-3 rounded-full">
            <MessageSquare className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{question.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>Asked by <strong className="text-gray-700">{question.author?.full_name || 'Unknown User'}</strong></span>
              <span>•</span>
              <span>{new Date(question.created_at).toLocaleString()}</span>
              {question.category && (
                <>
                  <span>•</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{question.category.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="prose max-w-none text-gray-700 bg-gray-50 p-6 rounded-lg border border-gray-100 whitespace-pre-wrap">
          {question.description}
        </div>
        
        {question.tags && question.tags.length > 0 && (
          <div className="flex gap-2 mt-4">
            {question.tags.map(t => (
              <span key={t.id} className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded">
                #{t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {question.status === 'open' ? (
        <div className="bg-steward-green/5 rounded-xl border border-steward-green/20 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Provide Official Answer</h2>
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Your answer will be marked as the official admin response. The user will receive an in-app notification immediately. The question will be locked from further edits by the user.
            </p>
          </div>

          <form action={handleAnswerSubmit} className="space-y-6">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <textarea
                id="content"
                name="content"
                rows={8}
                required
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-steward-green focus:ring-steward-green"
                placeholder="Write your comprehensive answer here..."
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="isFaq" 
                name="isFaq" 
                className="rounded border-gray-300 text-steward-green focus:ring-steward-green" 
              />
              <label htmlFor="isFaq" className="text-sm text-gray-700">
                Promote this Q&A to the FAQ list
              </label>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-steward-green text-white font-medium rounded-lg hover:bg-steward-orange transition-colors flex items-center justify-center gap-2"
              >
                Submit Official Answer
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6 sm:p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">This question has already been answered.</h2>
          <p className="text-yellow-700 mb-6">You can view the answer on the public help desk page.</p>
          <Link 
            href={`/hub/helpdesk/${question.id}`}
            className="inline-flex px-6 py-3 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors"
          >
            View Live Question
          </Link>
        </div>
      )}
    </div>
  )
}
