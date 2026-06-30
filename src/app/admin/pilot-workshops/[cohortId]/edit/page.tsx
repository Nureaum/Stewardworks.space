import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { getCohortById, updateCohort } from '@/app/actions/workshops/cohorts'
import { getWorkshopDays } from '@/app/actions/workshops/workshop-days'
import CohortFormWrapper from '@/components/workshops/admin/CohortFormWrapper'
import { UpdateCohortParams } from '@/types/workshops'
import Link from 'next/link'
import { ChevronLeft, Plus, Calendar } from 'lucide-react'

/**
 * Admin page for editing existing cohorts
 * Fetches cohort data and renders CohortForm component
 * Restricts access to admin/super_admin roles
 * Validates Requirements: R1, R12, R13, R20
 */
export default async function EditCohortPage({
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

  // Fetch cohort data
  let cohort
  try {
    cohort = await getCohortById(params.cohortId)
  } catch (error) {
    // If cohort not found or access denied, redirect to admin page
    redirect('/admin/pilot-workshops')
  }

  // Fetch workshop days for this cohort
  let workshopDays = []
  try {
    workshopDays = await getWorkshopDays(params.cohortId)
  } catch (error) {
    console.error('Error fetching workshop days:', error)
    // Continue with empty array if fetch fails
  }

  // Server action to handle form submission
  async function handleUpdateCohort(data: UpdateCohortParams) {
    'use server'
    
    await updateCohort(params.cohortId, data)
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
            <li className="text-steward-dark font-bold">Edit Cohort</li>
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
            Edit Cohort
          </h1>
          <p className="text-gray-600 font-medium">
            Update cohort details, schedule, capacity, and registration settings for{' '}
            <span className="font-bold text-steward-dark">{cohort.name}</span>.
          </p>
        </div>

        {/* Registration Stats */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Registration Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-black text-steward-dark">
                {cohort.registered_count}
              </div>
              <div className="text-sm font-bold text-gray-500 mt-1">
                Registered
              </div>
            </div>
            {cohort.waitlisted_count !== undefined && cohort.waitlisted_count > 0 && (
              <div>
                <div className="text-3xl font-black text-orange-600">
                  {cohort.waitlisted_count}
                </div>
                <div className="text-sm font-bold text-gray-500 mt-1">
                  Waitlisted
                </div>
              </div>
            )}
            {cohort.capacity && (
              <div>
                <div className="text-3xl font-black text-gray-400">
                  {cohort.capacity}
                </div>
                <div className="text-sm font-bold text-gray-500 mt-1">
                  Capacity
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cohort Form */}
        <CohortFormWrapper
          initialData={cohort}
          onSubmit={handleUpdateCohort}
          cancelPath="/admin/pilot-workshops"
        />

        {/* Workshop Days Management Section */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 lg:p-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl lg:text-3xl font-black text-steward-dark mb-2">
                  Workshop Days
                </h2>
                <p className="text-gray-600 font-medium">
                  Manage content for each day of the workshop series.
                </p>
              </div>
              <Link
                href={`/admin/pilot-workshops/${params.cohortId}/days/create`}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white bg-steward-green rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                Add Day
              </Link>
            </div>

            {/* Workshop Days List */}
            {workshopDays.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-bold mb-2">No workshop days created yet</p>
                <p className="text-sm text-gray-400 font-medium mb-6">
                  Create workshop days to add content, lessons, and deliverables.
                </p>
                <Link
                  href={`/admin/pilot-workshops/${params.cohortId}/days/create`}
                  className="inline-flex items-center gap-2 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white bg-steward-green rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  Create First Day
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {workshopDays.map((day: any) => (
                  <div
                    key={day.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-steward-dark transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-steward-green text-white text-xs font-black">
                          {day.day_number}
                        </span>
                        <h3 className="text-lg font-black text-steward-dark">
                          {day.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500">
                        <span>
                          Deliverable: {day.deliverable_type === 'pending_confirmation' ? 'TBD' : day.deliverable_type}
                        </span>
                        {day.requires_admin_approval && (
                          <span className="text-orange-600">• Requires Approval</span>
                        )}
                        {day.workshop_day_media && day.workshop_day_media.length > 0 && (
                          <span>• {day.workshop_day_media.length} media item{day.workshop_day_media.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/pilot-workshops/${params.cohortId}/days/${day.id}/edit`}
                        className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-steward-dark bg-white border-2 border-gray-200 rounded-xl hover:border-steward-dark hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
