import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { getCohortById } from '@/app/actions/workshops/cohorts'
import { updateWorkshopDay } from '@/app/actions/workshops/workshop-days'
import WorkshopDayFormWrapper from '@/components/workshops/admin/WorkshopDayFormWrapper'
import { UpdateWorkshopDayParams } from '@/types/workshops'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

/**
 * Admin page for editing existing workshop days
 * Fetches workshop day data and renders WorkshopDayForm component
 * Restricts access to admin/super_admin roles
 * Validates Requirements: R2, R13, R15
 */
export default async function EditWorkshopDayPage({
  params,
}: {
  params: { cohortId: string; dayId: string }
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

  // Fetch workshop day data with media
  const { data: workshopDay, error: dayError } = await supabase
    .from('workshop_days')
    .select(`
      *,
      workshop_day_media(*)
    `)
    .eq('id', params.dayId)
    .eq('cohort_id', params.cohortId)
    .single()

  if (dayError || !workshopDay) {
    // If day not found or doesn't belong to this cohort, redirect
    redirect(`/admin/pilot-workshops/${params.cohortId}/edit`)
  }

  // Sort media by sort_order
  workshopDay.workshop_day_media = (workshopDay.workshop_day_media || []).sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  )

  // Server action to handle form submission
  async function handleUpdateWorkshopDay(data: UpdateWorkshopDayParams) {
    'use server'
    
    await updateWorkshopDay(params.dayId, data)
    redirect(`/admin/pilot-workshops/${params.cohortId}/edit`)
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
            <li className="text-steward-dark font-bold">Edit Day {workshopDay.day_number}</li>
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
            Edit Workshop Day {workshopDay.day_number}
          </h1>
          <p className="text-gray-600 font-medium">
            Update content, deliverable requirements, and media for{' '}
            <span className="font-bold text-steward-dark">{workshopDay.title}</span> in{' '}
            {cohort.name}.
          </p>
        </div>

        {/* Workshop Day Form */}
        <WorkshopDayFormWrapper
          cohortId={params.cohortId}
          initialData={workshopDay}
          onSubmit={handleUpdateWorkshopDay}
          cancelPath={`/admin/pilot-workshops/${params.cohortId}/edit`}
        />
      </div>
    </div>
  )
}
