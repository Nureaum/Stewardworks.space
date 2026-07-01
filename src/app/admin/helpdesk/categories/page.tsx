import { getAllCategories, toggleCategoryStatus, createCategory } from '@/app/actions/helpdeskAdmin'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Admin - All Categories'
}

export default async function AdminAllCategoriesPage() {
  const categories = await getAllCategories()

  const handleAddCategory = async (formData: FormData) => {
    'use server'
    const name = formData.get('name') as string
    const desc = formData.get('description') as string
    if (name) {
      await createCategory(name, desc)
      revalidatePath('/admin/helpdesk/categories')
      revalidatePath('/admin/helpdesk')
    }
  }

  const handleToggleStatus = async (formData: FormData) => {
    'use server'
    const id = formData.get('id') as string
    const statusStr = formData.get('status') as string
    const status = statusStr === 'true'
    await toggleCategoryStatus(id, !status)
    revalidatePath('/admin/helpdesk/categories')
    revalidatePath('/admin/helpdesk')
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Link href="/admin/helpdesk" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Help Desk Settings
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">All Categories</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
        <form action={handleAddCategory} className="flex flex-col gap-3">
          <input name="name" placeholder="Category Name" required className="border p-2 rounded" />
          <input name="description" placeholder="Description (Optional)" className="border p-2 rounded" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 max-w-xs">
            Add Category
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-4">Manage Categories ({categories.length})</h2>
        <div className="space-y-3">
          {categories.map(c => (
            <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div>
                <div className="font-medium text-gray-900 text-lg">{c.name}</div>
                <div className="text-sm text-gray-500">{c.description}</div>
              </div>
              <form action={handleToggleStatus}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="status" value={c.is_active ? 'true' : 'false'} />
                <button type="submit" className={`text-sm px-4 py-2 rounded font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
