import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { getCohortById } from '@/app/actions/workshops/cohorts'
import { getSubmissionsForReview, reviewDeliverable } from '@/app/actions/workshops/admin-reviews'
import DeliverableReviewCard from '@/components/workshops/admin/DeliverableReviewCard'
import Link from 'next/link'
import { ChevronLeft, ClipboardCheck, Filter } from 'lucide-react'
import { Suspense } from 'react'

/**
 * Admin page for reviewing submitted deliverables
 * Renders DeliverableReviewCard for each submission with filtering
 * Groups submissions by day_number
 * Restricts access to admin/super_admin roles
 * Validates Requirements: R7, R19
 */

type SearchParams = {
  day?: string
  status?: string
}

async function ReviewsContent({ 
  cohortId, 
  searchParams 
}: { 
  cohortId: string
  searchParams: SearchParams 
}) {
  const supabase = createServerSupabaseClient()
  
  // Fetch cohort data
  const cohort = await getCohortById(cohortId)

  // Parse filters from search params
  const dayFilter = searchParams.day ? parseInt(searchParams.day) : undefined
  const statusFilter = searchParams.status as 'submitted' | 'approved' | 'rejected' | undefined

  // Fetch submissions with filters
  const submissions = await getSubmissionsForReview(cohortId, statusFilter)

  // Filter by day if specified
  const filteredSubmissions = dayFilter
    ? submissions.filter((sub: any) => sub.day_number === dayFilter)
    : submissions

  // Group submissions by day_number
  const submissionsByDay = filteredSubmissions.reduce((acc: any, sub: any) => {
    if (!acc[sub.day_number]) {
      acc[sub.day_number] = []
    }
    acc[sub.day_number].push(sub)
    return acc
  }, {})

  // Count pending reviews
  const pendingCount = filteredSubmissions.filter(
    (sub: any) => sub.deliverable_status === 'submitted'
  ).length

  // Get unique day numbers for filter
  const uniqueDays = Array.from(new Set(submissions.map((sub: any) => sub.day_number))).sort()

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-xl">
            <ClipboardCheck className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-steward-dark">
              {cohort.name}
            </h1>
            <p className="text-gray-600 font-medium mt-1">
              Review and approve deliverable submissions
            </p>
          </div>
        </div>

        {/* Cohort Info Bar */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Start Date
              </div>
              <div className="text-lg font-black text-steward-dark">
                {new Date(cohort.start_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
            
            <div>
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Pending Reviews
              </div>
              <div className="text-lg font-black text-orange-600">
                {pendingCount}
              </div>
            </div>

            <div>
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Total Submissions
              </div>
              <div className="text-lg font-black text-steward-dark">
                {filteredSubmissions.length}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">
              Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Day Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">
                Workshop Day
              </label>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/pilot-workshops/${cohortId}/reviews${statusFilter ? `?status=${statusFilter}` : ''}`}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                    !dayFilter
                      ? 'bg-steward-dark text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Days
                </Link>
                {uniqueDays.map((day: number) => (
                  <Link
                    key={day}
                    href={`/admin/pilot-workshops/${cohortId}/reviews?day=${day}${statusFilter ? `&status=${statusFilter}` : ''}`}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                      dayFilter === day
                        ? 'bg-steward-dark text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Day {day}
                  </Link>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/pilot-workshops/${cohortId}/reviews${dayFilter ? `?day=${dayFilter}` : ''}`}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                    !statusFilter
                      ? 'bg-steward-dark text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Status
                </Link>
                <Link
                  href={`/admin/pilot-workshops/${cohortId}/reviews?status=submitted${dayFilter ? `&day=${dayFilter}` : ''}`}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                    statusFilter === 'submitted'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Submitted
                </Link>
                <Link
                  href={`/admin/pilot-workshops/${cohortId}/reviews?status=approved${dayFilter ? `&day=${dayFilter}` : ''}`}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                    statusFilter === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Approved
                </Link>
                <Link
                  href={`/admin/pilot-workshops/${cohortId}/reviews?status=rejected${dayFilter ? `&day=${dayFilter}` : ''}`}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                    statusFilter === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Rejected
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Grouped by Day */}
      {Object.keys(submissionsByDay).length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
          <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-400 mb-2">
            No Submissions Found
          </h3>
          <p className="text-gray-500 font-medium">
            {statusFilter
              ? `No ${statusFilter} submissions to display.`
              : 'Participants haven\'t submitted any deliverables yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(submissionsByDay)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((dayNumber) => (
              <div key={dayNumber}>
                <h2 className="text-2xl font-black text-steward-dark mb-4">
                  Day {dayNumber}
                </h2>
                <div className="space-y-4">
                  {submissionsByDay[dayNumber].map((submission: any) => (
                    <DeliverableReviewCard
                      key={submission.progress_id}
                      submission={submission}
                      progressId={submission.progress_id}
                      onReview={async (status: 'approved' | 'rejected', note?: string) => {
                        'use server';
                        await reviewDeliverable(submission.progress_id, status, note);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  )
}

export default async function ReviewsPage({
  params,
  searchParams,
}: {
  params: { cohortId: string }
  searchParams: SearchParams
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
            <li className="text-steward-dark font-bold">Review Deliverables</li>
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

        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-steward-dark"></div>
          </div>
        }>
          <ReviewsContent cohortId={params.cohortId} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
