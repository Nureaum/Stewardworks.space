import { getQuestions } from '@/app/actions/helpdeskActions'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Clock } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin - All Questions'
}

export default async function AdminAllQuestionsPage({
  searchParams
}: {
  searchParams: { filter?: string }
}) {
  let allQuestions = await getQuestions()
  
  const { userId } = await auth()
  let currentUser = null
  if (userId) {
    const supabase = createServerSupabaseClient()
    const { data: profile } = await supabase.from('profiles').select('id, role').eq('clerk_user_id', userId).single()
    currentUser = profile
  }

  if (currentUser && currentUser.role !== 'super_admin') {
    const supabase = createServerSupabaseClient()
    const { data: answers } = await supabase.from('helpdesk_answers').select('question_id').eq('author_id', currentUser.id)
    const answeredIds = new Set(answers?.map(a => a.question_id) || [])
    allQuestions = allQuestions.filter(q => q.status === 'open' || answeredIds.has(q.id))
  }

  if (searchParams.filter === 'pending') {
    allQuestions = allQuestions.filter(q => q.status === 'open')
  } else if (searchParams.filter === 'answered') {
    allQuestions = allQuestions.filter(q => q.status === 'answered' || q.status === 'closed')
  }

  return (
    <div className="w-full p-6 md:p-8">
      <Link href="/admin/helpdesk" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Help Desk Settings
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6">
          <div className="bg-gray-100 p-3 rounded-full">
            <MessageSquare className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {searchParams.filter === 'pending' ? 'Pending Questions' : searchParams.filter === 'answered' ? 'Answered Questions' : 'All Submitted Questions'}
              {' '}({allQuestions.length})
            </h1>
            <p className="text-sm text-gray-500">
              {searchParams.filter === 'pending' 
                ? 'Manage and answer all pending questions from students.' 
                : searchParams.filter === 'answered' 
                ? 'View all answered and completed questions.' 
                : 'Manage and view all questions from students.'}
            </p>
          </div>
        </div>

        {allQuestions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No questions have been asked yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500">
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Question</th>
                  <th className="py-3 px-4 font-medium">Author</th>
                  {currentUser?.role === 'super_admin' && (
                    <th className="py-3 px-4 font-medium">Answered By</th>
                  )}
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allQuestions.map(q => {
                  const isOpen = q.status === 'open'
                  return (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOpen ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900 line-clamp-1">{q.title}</div>
                        {q.category && <div className="text-xs text-gray-500 mt-1">{q.category.name}</div>}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{q.author?.full_name || 'Anonymous'}</div>
                        {q.author?.email && <div className="text-xs text-gray-500 mt-0.5">{q.author.email}</div>}
                      </td>
                      {currentUser?.role === 'super_admin' && (
                        <td className="py-4 px-4 text-sm text-gray-700">
                          {(() => {
                            if (isOpen) return <span className="text-gray-400 italic text-xs">Pending</span>;
                            
                            const answerObj = Array.isArray(q.answers) ? q.answers[0] : q.answers;
                            if (answerObj && answerObj.author) {
                              return (
                                <>
                                  <div className="font-medium text-steward-blue">{answerObj.author.full_name || 'Admin'}</div>
                                  {answerObj.author.email && <div className="text-xs text-gray-500 mt-0.5">{answerObj.author.email}</div>}
                                </>
                              );
                            }
                            return <span className="text-gray-400 italic text-xs">Unknown Admin</span>;
                          })()}
                        </td>
                      )}
                      <td className="py-4 px-4 text-sm text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(q.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {isOpen ? (
                          <Link 
                            href={`/admin/helpdesk/questions/${q.id}`}
                            className="inline-flex text-sm font-medium bg-steward-green text-white px-3 py-1.5 rounded hover:bg-steward-orange transition-colors"
                          >
                            Answer
                          </Link>
                        ) : (
                          <Link 
                            href={`/admin/helpdesk/questions/${q.id}`}
                            className="inline-flex text-sm font-medium text-steward-green bg-steward-green/10 px-3 py-1.5 rounded hover:bg-steward-green/20 transition-colors"
                          >
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
