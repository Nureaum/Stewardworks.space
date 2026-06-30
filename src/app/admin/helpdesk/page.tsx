import { getQuestions } from '@/app/actions/helpdeskActions'
import { createCategory, toggleCategoryStatus, createTag, toggleTagStatus, getAllCategories, getAllTags } from '@/app/actions/helpdeskAdmin'
import { revalidatePath } from 'next/cache'

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

  const allQuestions = await getQuestions()
  
  // Separate open and answered questions
  const openQuestions = allQuestions.filter(q => q.status === 'open')
  const answeredQuestions = allQuestions.filter(q => q.status === 'answered' || q.status === 'closed')

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Help Desk Management</h1>
      
      {/* Questions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
          <span>Pending Questions ({openQuestions.length})</span>
          <a href="/admin/helpdesk/questions" className="text-sm font-medium text-steward-green hover:underline">View All</a>
        </h2>
        
        {openQuestions.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No open questions at the moment.</p>
        ) : (
          <div className="space-y-3">
            {openQuestions.map(q => (
              <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-yellow-50/50 hover:bg-yellow-50 transition-colors">
                <div className="mb-3 sm:mb-0">
                  <h3 className="font-semibold text-gray-900">{q.title}</h3>
                  <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    <span>By {q.author?.full_name || 'Unknown'}</span>
                    <span>•</span>
                    <span>{new Date(q.created_at).toLocaleDateString()}</span>
                    {q.category && (
                      <>
                        <span>•</span>
                        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs">{q.category.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <a 
                  href={`/admin/helpdesk/questions/${q.id}`}
                  className="bg-steward-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-steward-orange transition-colors text-center"
                >
                  Answer
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Categories Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          
          <form action={handleAddCategory} className="mb-6 flex flex-col gap-3">
            <input name="name" placeholder="Category Name" required className="border p-2 rounded" />
            <input name="description" placeholder="Description (Optional)" className="border p-2 rounded" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
              Add Category
            </button>
          </form>

          <div className="space-y-3">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">{c.name}</div>
                  <div className="text-sm text-gray-500">{c.description}</div>
                </div>
                <form action={handleToggleStatus}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="status" value={c.is_active ? 'true' : 'false'} />
                  <button type="submit" className={`text-sm px-3 py-1 rounded ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* Tags Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Tags</h2>
          
          <form action={handleAddTag} className="mb-6 flex flex-col gap-3">
            <input name="name" placeholder="Tag Name (e.g. react, nextjs)" required className="border p-2 rounded" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
              Add Tag
            </button>
          </form>

          <div className="flex flex-col gap-2">
            {tags.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50/50">
                <span className="font-medium text-blue-800">#{t.name}</span>
                <form action={handleToggleTagStatus}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="status" value={t.is_active ? 'true' : 'false'} />
                  <button type="submit" className={`text-sm px-3 py-1 rounded ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
