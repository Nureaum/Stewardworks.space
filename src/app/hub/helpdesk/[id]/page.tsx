import { getQuestionById, incrementViewCount } from '@/app/actions/helpdeskActions'
import { getAnswersForQuestion } from '@/app/actions/helpdeskAnswers'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Clock, Eye, MessageCircle } from 'lucide-react'
import AnswerBlock from '@/components/helpdesk/AnswerBlock'
import AnswerForm from '@/components/helpdesk/AnswerForm'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const question = await getQuestionById(params.id)
    return { title: `${question.title} - Help Desk` }
  } catch (e) {
    return { title: 'Question Not Found' }
  }
}

export default async function QuestionDetailPage({ params }: { params: { id: string } }) {
  let question;
  try {
    question = await getQuestionById(params.id)
    // Increment view count asynchronously
    incrementViewCount(params.id).catch(console.error)
  } catch (error) {
    notFound()
  }

  const answers = await getAnswersForQuestion(params.id)
  
  // Check user role to determine if they can answer
  const { userId } = await auth()
  let isStaff = false
  if (userId) {
    const supabase = createServerSupabaseClient()
    const { data: profile } = await supabase.from('profiles').select('role').eq('clerk_user_id', userId).single()
    if (profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
      isStaff = true
    }
  }

  const isAnswered = question.status === 'answered' || question.status === 'closed'
  const canAnswer = isStaff && question.status === 'open'

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Link href="/hub/helpdesk" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Help Desk
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {question.category && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-md">
                {question.category.name}
              </span>
            )}
            <span className={`px-3 py-1 text-sm font-medium rounded-md ${isAnswered ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {question.status.toUpperCase()}
            </span>
            {question.tags?.map(tag => (
              <span key={tag.id} className="px-3 py-1 bg-steward-green/10 text-steward-green text-sm font-medium rounded-md">
                #{tag.name}
              </span>
            ))}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{question.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-b border-gray-100 pb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-steward-green/10 text-steward-green flex items-center justify-center font-bold text-sm">
                {question.author?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="font-medium text-gray-900">{question.author?.full_name || 'Anonymous'}</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{new Date(question.created_at).toLocaleString()}</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>{question.view_count} views</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div 
          className="prose prose-blue max-w-none text-gray-800"
          dangerouslySetInnerHTML={{ __html: question.description }}
        />
      </div>

      {/* Answers Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-steward-green" />
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>
        
        <div className="space-y-6">
          {answers.map(answer => (
            <AnswerBlock key={answer.id} answer={answer} />
          ))}
        </div>

        {answers.length === 0 && !canAnswer && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center mt-6">
            <p className="text-gray-500">No answers yet. Staff will review and answer this shortly.</p>
          </div>
        )}

        {canAnswer && (
          <AnswerForm questionId={question.id} />
        )}
      </div>
    </div>
  )
}
