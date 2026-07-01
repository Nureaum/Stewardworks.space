import { getAllTags, toggleTagStatus, createTag } from '@/app/actions/helpdeskAdmin'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Admin - All Tags'
}

export default async function AdminAllTagsPage() {
  const tags = await getAllTags()

  const handleAddTag = async (formData: FormData) => {
    'use server'
    const name = formData.get('name') as string
    if (name) {
      await createTag(name)
      revalidatePath('/admin/helpdesk/tags')
      revalidatePath('/admin/helpdesk')
    }
  }

  const handleToggleTagStatus = async (formData: FormData) => {
    'use server'
    const id = formData.get('id') as string
    const statusStr = formData.get('status') as string
    const status = statusStr === 'true'
    await toggleTagStatus(id, !status)
    revalidatePath('/admin/helpdesk/tags')
    revalidatePath('/admin/helpdesk')
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Link href="/admin/helpdesk" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Help Desk Settings
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">All Tags</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Tag</h2>
        <form action={handleAddTag} className="flex flex-col gap-3">
          <input name="name" placeholder="Tag Name (e.g. react, nextjs)" required className="border p-2 rounded" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 max-w-xs">
            Add Tag
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-4">Manage Tags ({tags.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tags.map(t => (
            <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50">
              <span className="font-medium text-blue-800 text-lg">#{t.name}</span>
              <form action={handleToggleTagStatus}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="status" value={t.is_active ? 'true' : 'false'} />
                <button type="submit" className={`text-sm px-4 py-2 rounded font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {t.is_active ? 'Active' : 'Inactive'}
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
