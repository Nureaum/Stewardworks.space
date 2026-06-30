import Link from 'next/link'
import { getQuestions, getCategories, getTags, getFaqs } from '@/app/actions/helpdeskActions'
import QuestionCard from '@/components/helpdesk/QuestionCard'
import { Search, Plus, MessageSquare, ArrowLeft } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export const metadata = {
  title: 'Help Desk'
}

export default async function HelpdeskPage({
  searchParams,
}: {
  searchParams: { category?: string; tag?: string }
}) {
  const [questions, categories, tags, faqs] = await Promise.all([
    getQuestions(searchParams.category, searchParams.tag),
    getCategories(),
    getTags(),
    getFaqs()
  ])

  const { userId } = await auth()
  let profileId = null
  if (userId) {
    const supabase = createServerSupabaseClient()
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_user_id', userId).single()
    if (profile) profileId = profile.id
  }

  const faqQuestionIds = new Set(faqs.map((f: any) => f.question?.id))
  const myQuestions = questions.filter(q => q.author?.id === profileId)

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Link href="/hub" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Hub
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-steward-green" />
            Help Desk
          </h1>
          <p className="text-gray-600 mt-2">Find answers, ask questions, and connect with staff.</p>
        </div>
        <Link 
          href="/hub/helpdesk/ask" 
          className="flex items-center gap-2 bg-steward-green text-white px-5 py-2.5 rounded-lg hover:bg-steward-orange transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Ask a Question
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-8">
          {/* Categories */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/hub/helpdesk" 
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${!searchParams.category ? 'bg-steward-green/10 text-steward-green font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  All Categories
                </Link>
              </li>
              {categories.map(c => (
                <li key={c.id}>
                  <Link 
                    href={`/hub/helpdesk?category=${c.id}${searchParams.tag ? `&tag=${searchParams.tag}` : ''}`} 
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${searchParams.category === c.id ? 'bg-steward-green/10 text-steward-green font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <Link
                  key={t.id}
                  href={`/hub/helpdesk?tag=${t.id}${searchParams.category ? `&category=${searchParams.category}` : ''}`}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${searchParams.tag === t.id ? 'bg-steward-green text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  #{t.name}
                </Link>
              ))}
              {searchParams.tag && (
                <Link href={`/hub/helpdesk${searchParams.category ? `?category=${searchParams.category}` : ''}`} className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100">
                  Clear Tag
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main List */}
        <div className="lg:col-span-3">
          
          {/* FAQ Section */}
          {!searchParams.category && !searchParams.tag && faqs.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-steward-gold text-2xl">★</span> Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq: any) => (
                  <div key={faq.id} className="bg-gradient-to-r from-steward-gold/10 to-transparent rounded-xl border border-steward-gold/20 p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">{faq.question?.title}</h3>
                    <div className="text-gray-700 text-sm prose max-w-none mb-3 line-clamp-3 whitespace-pre-wrap">{faq.content}</div>
                    <Link href={`/hub/helpdesk/${faq.question?.id}`} className="text-steward-green font-medium text-sm hover:underline">
                      Read full discussion →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-xl font-bold text-gray-900 mb-4">My Questions</h2>
          {myQuestions.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-500 mb-6">There are no questions matching your current filters.</p>
              <Link 
                href="/hub/helpdesk/ask" 
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Ask the first question
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myQuestions.map(q => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
