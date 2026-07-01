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
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <Link href="/hub/helpdesk" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-steward-dark mb-8 transition-colors uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" />
        Back to Help Desk
      </Link>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden mb-10 relative">
        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-steward-green via-steward-gold to-steward-orange"></div>
        
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {question.category && (
                <span className="px-4 py-1.5 bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold uppercase tracking-widest rounded-full shadow-sm">
                  {question.category.name}
                </span>
              )}
              <span className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full shadow-sm ${isAnswered ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                {question.status}
              </span>
              {question.tags?.map(tag => (
                <span key={tag.id} className="px-4 py-1.5 bg-steward-green/5 border border-steward-green/10 text-steward-green text-xs font-bold uppercase tracking-widest rounded-full shadow-sm">
                  #{tag.name}
                </span>
              ))}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold text-steward-dark mb-8 leading-tight tracking-tight">
              {question.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b border-gray-100 pb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-steward-dark to-gray-800 text-steward-gold flex items-center justify-center font-black shadow-md border border-gray-900">
                  {question.author?.full_name?.charAt(0) || 'U'}
                </div>
                <span className="font-bold text-steward-dark text-base">{question.author?.full_name || 'Anonymous User'}</span>
              </div>
              <span className="hidden sm:inline text-gray-300">•</span>
              <div className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{new Date(question.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-steward-offwhite/50 rounded-3xl p-8 border border-steward-cream/50 relative shadow-inner">
            <div className="absolute left-0 top-10 bottom-10 w-1.5 bg-gradient-to-b from-steward-orange to-steward-gold rounded-r-full"></div>
            <h3 className="text-xs font-black text-steward-orange mb-6 uppercase tracking-widest pl-4">Detailed Description</h3>
            <div 
              className="prose prose-lg max-w-none text-steward-dark pl-4 whitespace-pre-wrap font-medium leading-relaxed"
              dangerouslySetInnerHTML={{ __html: question.description }}
            />
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="mt-12">
        
        <div className="space-y-8">
          {answers.map(answer => (
            <AnswerBlock key={answer.id} answer={answer} />
          ))}
        </div>

        {answers.length === 0 && !canAnswer && (
          <div className="bg-gray-50 border border-gray-200 rounded-[2rem] p-12 text-center mt-8 shadow-inner">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
              <Clock className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Awaiting Response</h3>
            <p className="text-gray-500 font-medium">Our staff has been notified and will review and answer this shortly.</p>
          </div>
        )}

        {canAnswer && (
          <div className="mt-12">
            <AnswerForm questionId={question.id} />
          </div>
        )}
      </div>
    </div>
  )
}
