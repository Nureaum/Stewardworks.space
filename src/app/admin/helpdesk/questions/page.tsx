import { getQuestions } from '@/app/actions/helpdeskActions'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Clock } from 'lucide-react'

export const metadata = {
  title: 'Admin - All Questions'
}

export default async function AdminAllQuestionsPage() {
  const allQuestions = await getQuestions()

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
            <h1 className="text-2xl font-bold text-gray-900">All Submitted Questions</h1>
            <p className="text-sm text-gray-500">Manage and answer all questions from students.</p>
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
                        {q.author?.full_name || 'Anonymous'}
                      </td>
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
                            href={`/hub/helpdesk/${q.id}`}
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
