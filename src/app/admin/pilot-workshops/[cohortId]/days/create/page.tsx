import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { getCohortById } from '@/app/actions/workshops/cohorts'
import { createWorkshopDay } from '@/app/actions/workshops/workshop-days'
import WorkshopDayFormWrapper from '@/components/workshops/admin/WorkshopDayFormWrapper'
import { CreateWorkshopDayParams } from '@/types/workshops'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

/**
 * Admin page for creating new workshop days
 * Renders WorkshopDayForm component for day creation
 * Restricts access to admin/super_admin roles
 * Validates Requirements: R2, R13, R15
 */
export default async function CreateWorkshopDayPage({
  params,
}: {
  params: { cohortId: string }
}) {
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

  // Fetch cohort data to verify it exists and display cohort name
  let cohort
  try {
    cohort = await getCohortById(params.cohortId)
  } catch (error) {
    // If cohort not found or access denied, redirect to admin page
    redirect('/admin/pilot-workshops')
  }

  // Server action to handle form submission
  async function handleCreateWorkshopDay(data: CreateWorkshopDayParams) {
    'use server'
    
    const workshopDay = await createWorkshopDay(params.cohortId, data)
    // Redirect to edit page after creation to allow media uploads
    redirect(`/admin/pilot-workshops/${params.cohortId}/days/${workshopDay.id}/edit`)
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
            <li>
              <Link 
                href={`/admin/pilot-workshops/${params.cohortId}/edit`}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {cohort.name}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-steward-dark font-bold">Create Day</li>
          </ol>
        </nav>

        {/* Back Button */}
        <Link
          href={`/admin/pilot-workshops/${params.cohortId}/edit`}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-steward-dark transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Cohort Edit
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-black text-steward-dark mb-2">
            Create Workshop Day
          </h1>
          <p className="text-gray-600 font-medium">
            Add a new workshop day to{' '}
            <span className="font-bold text-steward-dark">{cohort.name}</span>.
            You'll be able to add Topics (Videos/Articles/Links) after you create the day.
          </p>
        </div>

        {/* Workshop Day Form */}
        <WorkshopDayFormWrapper
          cohortId={params.cohortId}
          onSubmit={handleCreateWorkshopDay}
          cancelPath={`/admin/pilot-workshops/${params.cohortId}/edit`}
        />
      </div>
    </div>
  )
}
