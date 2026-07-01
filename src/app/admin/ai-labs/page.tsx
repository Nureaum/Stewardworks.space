import { getAILabs } from '@/app/actions/ai-labs'
import Link from 'next/link'
import { Plus, Beaker } from 'lucide-react'
import { AILabActions } from '@/components/admin/AILabActions'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export const metadata = {
  title: 'AI Labs Management - Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminAILabsPage() {
  try {
    const { userId } = await auth()
    const supabase = createServerSupabaseClient()
    const { data: profile } = await supabase.from('profiles').select('role').eq('clerk_user_id', userId).single()
    const userRole = profile?.role

    const aiLabs = await getAILabs()

    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 w-full">
            <div className="flex items-center gap-3">
              <Beaker className="w-8 h-8 text-steward-dark" />
              <h1 className="text-3xl font-black uppercase tracking-widest text-steward-dark">AI Labs Management</h1>
            </div>
            <Link
              href="/admin/ai-labs/create"
              className="flex items-center gap-2 bg-steward-dark hover:bg-black text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create AI Lab
            </Link>
          </div>
          <p className="text-lg text-gray-600">
            Create and manage AI Labs associated with Cohorts.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {aiLabs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No AI Labs found. Create one to get started.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600">Title</th>
                  <th className="p-4 font-semibold text-gray-600">Cohort (Workshop)</th>
                  {userRole === 'super_admin' && (
                    <th className="p-4 font-semibold text-gray-600">Posted By</th>
                  )}
                  <th className="p-4 font-semibold text-gray-600">Created At</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {aiLabs.map((lab) => (
                  <tr key={lab.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{lab.title}</td>
                    <td className="p-4 text-gray-600">{lab.cohort_name}</td>
                    {userRole === 'super_admin' && (
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-steward-blue">{lab.creator?.full_name || 'Unknown Admin'}</span>
                          <span className="text-xs text-gray-500 mt-0.5">{lab.creator?.email}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-4 text-gray-600">
                      {new Date(lab.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end">
                        <AILabActions labId={lab.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-8 text-red-600">
        Error loading AI Labs. Please try again.
      </div>
    )
  }
}
