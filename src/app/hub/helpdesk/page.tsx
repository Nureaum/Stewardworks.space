import Link from 'next/link'
import { getQuestions, getCategories, getTags, getFaqs } from '@/app/actions/helpdeskActions'
import QuestionCard from '@/components/helpdesk/QuestionCard'
import FaqAccordion from '@/components/helpdesk/FaqAccordion'
import { Search, Plus, MessageSquare, ArrowLeft } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

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
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Link href="/hub" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-steward-dark mb-6 transition-colors uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" />
        Back to Hub
      </Link>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-steward-dark p-6 md:p-10 mb-10 shadow-2xl border border-steward-dark/80 group">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-steward-green/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none transition-transform duration-1000 group-hover:scale-110 group-hover:bg-steward-green/30"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-steward-blue/20 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/90 text-[10px] font-bold uppercase tracking-widest mb-4 backdrop-blur-md shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-steward-gold animate-pulse"></span>
              Help & Support Center
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">
              How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-steward-green via-steward-gold to-steward-orange">help you</span> today?
            </h1>
            <p className="text-gray-300 text-base md:text-lg font-medium max-w-lg leading-relaxed">
              Browse frequently asked questions, explore categories, or reach out to our staff directly.
            </p>
          </div>
          
          <Link 
            href="/hub/helpdesk/ask" 
            className="group/btn relative inline-flex flex-shrink-0 items-center gap-2.5 bg-white text-steward-dark px-6 py-3.5 rounded-xl font-bold text-base overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-steward-green/10 to-steward-gold/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
            <Plus className="w-5 h-5 relative z-10 group-hover/btn:rotate-90 transition-transform duration-500" />
            <span className="relative z-10">Ask a Question</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-8">
          {/* Categories */}
          <div className="bg-white rounded-3xl border border-gray-100/80 p-7 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:border-steward-green/20 transition-all duration-300">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/hub/helpdesk" 
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${!searchParams.category ? 'bg-gradient-to-r from-steward-green to-steward-green/90 text-white shadow-md shadow-steward-green/20 scale-[1.02]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  All Categories
                </Link>
              </li>
              {categories.map(c => (
                <li key={c.id}>
                  <Link 
                    href={`/hub/helpdesk?category=${c.id}${searchParams.tag ? `&tag=${searchParams.tag}` : ''}`} 
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${searchParams.category === c.id ? 'bg-gradient-to-r from-steward-green to-steward-green/90 text-white shadow-md shadow-steward-green/20 scale-[1.02]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-3xl border border-gray-100/80 p-7 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:border-steward-dark/20 transition-all duration-300">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Popular Tags</h3>
            <div className="flex flex-wrap gap-2.5">
              {tags.map(t => (
                <Link
                  key={t.id}
                  href={`/hub/helpdesk?tag=${t.id}${searchParams.category ? `&category=${searchParams.category}` : ''}`}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${searchParams.tag === t.id ? 'bg-steward-dark text-white shadow-md shadow-steward-dark/20 scale-[1.05]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}
                >
                  #{t.name}
                </Link>
              ))}
              {searchParams.tag && (
                <Link href={`/hub/helpdesk${searchParams.category ? `?category=${searchParams.category}` : ''}`} className="px-4 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors w-full text-center mt-2">
                  Clear Tag Filter
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main List */}
        <div className="lg:col-span-3">
          
          {/* FAQ Section */}
          {!searchParams.category && !searchParams.tag && faqs.length > 0 && (
            <div className="mb-14">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-4">
                  <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-steward-gold/20 to-steward-gold/5 text-steward-gold shadow-inner border border-steward-gold/20">
                    ★
                  </span>
                  Frequently Asked Questions
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
              </div>
              
              <FaqAccordion faqs={faqs} />
            </div>
          )}

          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center gap-4">
              <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-steward-blue/20 to-steward-blue/5 text-steward-blue shadow-inner border border-steward-blue/20">
                <MessageSquare className="w-6 h-6" />
              </span>
              My Questions
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
          </div>

          {myQuestions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-500 text-base mb-8 max-w-md mx-auto">You haven't asked any questions matching these filters yet. Need help? Don't hesitate to ask!</p>
              <Link 
                href="/hub/helpdesk/ask" 
                className="inline-flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-800 px-8 py-3 rounded-xl hover:border-steward-dark hover:text-steward-dark transition-colors font-bold text-sm uppercase tracking-widest shadow-sm hover:shadow-md"
              >
                Ask a question
              </Link>
            </div>
          ) : (
            <div className="space-y-5 mb-12">
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
