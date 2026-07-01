import { getQuestions } from '@/app/actions/helpdeskActions'
import { createCategory, toggleCategoryStatus, createTag, toggleTagStatus, getAllCategories, getAllTags } from '@/app/actions/helpdeskAdmin'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin - Help Desk Settings'
}

export default async function AdminHelpdeskPage() {
  const [categories, tags] = await Promise.all([
    getAllCategories(),
    getAllTags()
  ])

  const handleAddCategory = async (formData: FormData) => {
    'use server'
    const name = formData.get('name') as string
    const desc = formData.get('description') as string
    if (name) {
      await createCategory(name, desc)
      revalidatePath('/admin/helpdesk')
    }
  }

  const handleToggleStatus = async (formData: FormData) => {
    'use server'
    const id = formData.get('id') as string
    const statusStr = formData.get('status') as string
    const status = statusStr === 'true'
    await toggleCategoryStatus(id, !status)
    revalidatePath('/admin/helpdesk')
  }

  const handleAddTag = async (formData: FormData) => {
    'use server'
    const name = formData.get('name') as string
    if (name) {
      await createTag(name)
      revalidatePath('/admin/helpdesk')
    }
  }

  const handleToggleTagStatus = async (formData: FormData) => {
    'use server'
    const id = formData.get('id') as string
    const statusStr = formData.get('status') as string
    const status = statusStr === 'true'
    await toggleTagStatus(id, !status)
    revalidatePath('/admin/helpdesk')
  }

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

  // Separate open and answered questions
  const openQuestions = allQuestions.filter(q => q.status === 'open')
  const answeredQuestions = allQuestions.filter(q => q.status === 'answered' || q.status === 'closed')

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Help Desk Management</h1>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Pending Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Pending Questions</h2>
              <span className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 rounded-full font-bold text-lg shadow-sm">
                {openQuestions.length}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-6">Requires your attention. Review and provide official answers to user queries.</p>
          </div>
          
          <a href="/admin/helpdesk/questions?filter=pending" className="relative z-10 inline-flex items-center justify-center w-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 py-2.5 rounded-xl text-sm font-semibold transition-colors border border-red-100">
            Review Pending Questions
            <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </a>
        </div>

        {/* Answered Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Answered Questions</h2>
              <span className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-full font-bold text-lg shadow-sm">
                {answeredQuestions.length}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-6">View previously answered questions and manage official responses.</p>
          </div>
          
          <a href="/admin/helpdesk/questions?filter=answered" className="relative z-10 inline-flex items-center justify-center w-full bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 py-2.5 rounded-xl text-sm font-semibold transition-colors border border-green-100">
            View Answered History
            <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Categories Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          
          <form action={handleAddCategory} className="mb-6 flex flex-col gap-3">
            <input name="name" placeholder="Category Name" required className="border p-2 rounded" />
            <input name="description" placeholder="Description (Optional)" className="border p-2 rounded" />
            <button type="submit" className="bg-steward-green text-white px-4 py-2 rounded font-medium hover:bg-steward-orange transition-colors">
              Add Category
            </button>
          </form>

          <div className="space-y-3">
            {categories.length > 0 && (
              <div className="mt-4 text-center">
                <a href="/admin/helpdesk/categories" className="inline-block bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full">
                  Show All {categories.length} Categories
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Tags Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Tags</h2>
          
          <form action={handleAddTag} className="mb-6 flex flex-col gap-3">
            <input name="name" placeholder="Tag Name (e.g. react, nextjs)" required className="border p-2 rounded" />
            <button type="submit" className="bg-steward-green text-white px-4 py-2 rounded font-medium hover:bg-steward-orange transition-colors">
              Add Tag
            </button>
          </form>

          <div className="flex flex-col gap-2">
            {tags.length > 0 && (
              <div className="mt-4 text-center">
                <a href="/admin/helpdesk/tags" className="inline-block bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full">
                  Show All {tags.length} Tags
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
