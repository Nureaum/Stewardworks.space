import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { createCohort } from '@/app/actions/workshops/cohorts'
import CohortFormWrapper from '@/components/workshops/admin/CohortFormWrapper'
import { CreateCohortParams } from '@/types/workshops'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

/**
 * Admin page for creating new cohorts
 * Restricts access to admin/super_admin roles
 * Validates Requirements: R1, R12, R13, R20
 */
export default async function CreateCohortPage() {
  // Check authentication and authorization
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const supabase = createServerSupabaseClient()
  
  // Get user profile and verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()
  
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/hub/pilot-workshops')
  }

  // Server action to handle form submission
  async function handleCreateCohort(data: CreateCohortParams) {
    'use server'
    
    const cohort = await createCohort(data)
    redirect(`/admin/pilot-workshops/${cohort.id}/edit`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm font-medium">
            <li>
              <Link 
                href="/hub/pilot-workshops"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Pilot Workshops
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link 
                href="/admin/pilot-workshops"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Admin
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-steward-dark font-bold">Create Cohort</li>
          </ol>
        </nav>

        {/* Back Button */}
        <Link
          href="/admin/pilot-workshops"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-steward-dark transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-black text-steward-dark mb-2">
            Create New Cohort
          </h1>
          <p className="text-gray-600 font-medium">
            Create a new workshop cohort with schedule, capacity, and registration settings.
          </p>
        </div>

        {/* Cohort Form */}
        <CohortFormWrapper
          onSubmit={handleCreateCohort}
          cancelPath="/admin/pilot-workshops"
        />
      </div>
    </div>
  )
}
