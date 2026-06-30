import { getCohorts } from '@/app/actions/workshops/cohorts'
import AdminCohortTable from '@/components/workshops/admin/AdminCohortTable'
import Link from 'next/link'
import { Plus, Calendar } from 'lucide-react'

export const metadata = {
  title: 'Cohort Management - Admin',
  description: 'Manage workshop cohorts, registrations, and deliverable reviews',
}

export default async function AdminCohortManagementPage() {
  try {
    const cohorts = await getCohorts()

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Cohort Management</h1>
            </div>
            <Link
              href="/admin/pilot-workshops/create"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Cohort
            </Link>
          </div>
          <p className="text-lg text-gray-600">
            Manage workshop cohorts, registrations, and deliverable reviews
          </p>
        </div>

        {/* Client-side interactive table */}
        <AdminCohortTable cohorts={cohorts} />
      </div>
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load cohorts'
    
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700 mb-4">{message}</p>
          <Link
            href="/hub/pilot-workshops"
            className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800"
          >
            Back to Workshops
          </Link>
        </div>
      </div>
    )
  }
}
