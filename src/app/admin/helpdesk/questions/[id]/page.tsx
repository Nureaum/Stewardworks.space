import { getQuestionById } from '@/app/actions/helpdeskActions'
import { answerQuestion } from '@/app/actions/helpdeskAdmin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, AlertCircle } from 'lucide-react'
import AdminAnswerForm from '@/components/admin/AdminAnswerForm'
import { auth } from '@clerk/nextjs/server'

export const metadata = {
  title: 'Admin - Answer Question'
}

export default async function AdminAnswerQuestionPage({ params, searchParams }: { params: { id: string }, searchParams?: { edit?: string } }) {
  try {
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
        revalidatePath('/hub/helpdesk') // <--- Flushes the FAQ page cache
        revalidatePath('/admin/helpdesk', 'layout')
        redirect('/admin/helpdesk')
      }
    }

    let answer = null
    if (question.status !== 'open') {
      const { createServerSupabaseClient } = await import('@/utils/supabase/server')
      const supabase = createServerSupabaseClient()
      const { data: answerData, error: answerError } = await supabase
        .from('helpdesk_answers')
        .select('content, is_promoted_to_faq, author_id, author:author_id(full_name)')
        .eq('question_id', question.id)
        .maybeSingle()
        
      if (answerError) {
        console.error("Error fetching answer:", answerError)
      }
      answer = answerData
    }

    const { userId } = await auth()
    let currentUser = null
    if (userId) {
      const { createServerSupabaseClient } = await import('@/utils/supabase/server')
      const supabase = createServerSupabaseClient()
      const { data: profile } = await supabase.from('profiles').select('id, role').eq('clerk_user_id', userId).single()
      currentUser = profile
    }
    const canEdit = currentUser && answer && (currentUser.id === answer.author_id)
    const isEditing = canEdit && searchParams?.edit === 'true'

    return (
      <div className="w-full max-w-5xl mx-auto p-6 md:p-8">
        <Link href="/admin/helpdesk/questions" className="inline-flex items-center gap-2 text-sm font-semibold text-steward-blue hover:text-steward-dark mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Questions List
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8 relative">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-steward-green via-steward-gold to-steward-orange"></div>
          
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start gap-6 mb-10">
              <div className="bg-steward-offwhite p-4 rounded-2xl shrink-0 shadow-sm border border-steward-cream">
                <MessageSquare className="w-8 h-8 text-steward-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-black text-steward-blue mb-2 uppercase tracking-widest">Student Question</h3>
                <h1 className="text-3xl font-extrabold text-steward-dark mb-4 leading-tight">{question.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-6 h-6 bg-steward-dark text-steward-gold rounded-full flex items-center justify-center text-[10px] font-bold">
                      {question.author?.full_name?.charAt(0) || '?'}
                    </span>
                    <strong className="text-steward-dark">{question.author?.full_name || 'Unknown User'}</strong>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span>{new Date(question.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  {question.category && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="bg-steward-green text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm">{question.category.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-steward-offwhite/50 rounded-2xl p-8 border border-steward-cream/50 relative">
              <div className="absolute left-0 top-8 bottom-8 w-1 bg-steward-orange rounded-r-full"></div>
              <h3 className="text-xs font-black text-steward-orange mb-4 uppercase tracking-widest pl-2">Detailed Description</h3>
              <div className="prose max-w-none text-steward-dark pl-2 whitespace-pre-wrap font-medium leading-relaxed">
                {question.description}
              </div>
            </div>
            
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                {question.tags.map((t: any) => (
                  <span key={t.id} className="text-xs font-bold bg-steward-blue/10 text-steward-blue px-3 py-1.5 rounded-lg border border-steward-blue/20">
                    #{t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {question.status === 'open' ? (
          <div className="bg-gradient-to-br from-steward-green/5 to-steward-blue/5 rounded-2xl border border-steward-green/20 p-8 md:p-10 shadow-sm relative overflow-hidden">
            {/* Decorative background circle */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-steward-green/5 rounded-full blur-3xl pointer-events-none"></div>

            <h2 className="text-2xl font-extrabold text-steward-dark mb-8 relative z-10">Provide Official Response</h2>
            
            <div className="bg-white border-l-4 border-l-steward-gold p-5 rounded-r-xl shadow-sm mb-8 flex items-start gap-4 relative z-10">
              <AlertCircle className="w-6 h-6 text-steward-gold shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-gray-600 leading-relaxed">
                Your answer will be marked as the <strong className="text-steward-dark">official admin response</strong>. The user will receive an in-app notification immediately. The question will be locked from further edits by the user once answered.
              </p>
            </div>

            <div className="relative z-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <AdminAnswerForm questionId={params.id} submitAction={handleAnswerSubmit} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-steward-green/30 p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-steward-green/5 rounded-bl-[100px] -mr-10 -mt-10 pointer-events-none"></div>
            
            <h2 className="text-2xl font-extrabold text-steward-dark mb-8 flex items-center gap-4 relative z-10">
              <span className="bg-steward-green text-white text-xs px-3 py-1.5 rounded-full uppercase tracking-widest font-black shadow-sm">Answered</span>
              Official Response
            </h2>
            
            {isEditing ? (
              <div className="relative z-10 bg-white p-6 rounded-2xl shadow-sm border border-steward-blue/20 mt-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <h3 className="font-bold text-steward-dark">Editing Official Response</h3>
                  <Link href={`/admin/helpdesk/questions/${params.id}`} className="text-xs font-bold text-gray-500 hover:text-steward-dark uppercase tracking-widest">
                    Cancel
                  </Link>
                </div>
                <AdminAnswerForm 
                  questionId={params.id} 
                  submitAction={handleAnswerSubmit} 
                  initialContent={answer?.content} 
                  initialIsFaq={answer?.is_promoted_to_faq} 
                />
              </div>
            ) : answer ? (
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-6 h-6 bg-steward-green text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                        {answer.author?.full_name?.charAt(0) || 'A'}
                      </span>
                      <span>Answered by <strong className="text-steward-dark">{answer.author?.full_name || 'Admin'}</strong></span>
                    </span>
                    {answer.is_promoted_to_faq && (
                      <span className="bg-steward-gold/20 text-steward-gold text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ml-2">FAQ Promoted</span>
                    )}
                  </div>
                  {canEdit && (
                    <Link href={`/admin/helpdesk/questions/${params.id}?edit=true`} className="text-xs font-black uppercase tracking-widest text-steward-blue hover:text-steward-dark bg-steward-blue/5 hover:bg-steward-blue/10 px-4 py-2 rounded-lg transition-colors">
                      Edit Response
                    </Link>
                  )}
                </div>
                <div className="prose max-w-none text-steward-dark bg-steward-green/5 p-8 rounded-2xl border border-steward-green/10 whitespace-pre-wrap font-medium leading-relaxed">
                  {answer.content}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Answer details could not be loaded.</p>
            )}
          </div>
        )}
      </div>
    )
  } catch (error: any) {
    console.error("AdminAnswerQuestionPage error:", error)
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center text-red-600">
        <h1 className="text-2xl font-bold mb-4">Failed to load question</h1>
        <p>{error.message}</p>
        <Link href="/admin/helpdesk/questions" className="text-steward-green hover:underline mt-4 inline-block">
          Return to Help Desk Admin
        </Link>
      </div>
    )
  }
}
