import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { getCohortById } from '@/app/actions/workshops/cohorts'
import { getRegistrations } from '@/app/actions/workshops/admin-reviews'
import RegistrantList from '@/components/workshops/admin/RegistrantList'
import Link from 'next/link'
import { ChevronLeft, Download, Users } from 'lucide-react'
import { CohortWithRegistrationCount } from '@/types/workshops'

/**
 * Admin page for viewing and managing cohort registrations
 * Renders RegistrantList component with cohort details
 * Includes export to CSV functionality
 * Restricts access to admin/super_admin roles
 * Validates Requirements: R10, R13
 */
export default async function RegistrationsPage({
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
  let cohort: CohortWithRegistrationCount
  try {
    cohort = await getCohortById(params.cohortId)
  } catch (error) {
    // If cohort not found or access denied, redirect to admin page
    redirect('/admin/pilot-workshops')
  }

  // Fetch registrations for export functionality
  let registrations: any[] = []
  try {
    registrations = await getRegistrations(params.cohortId)
  } catch (error) {
    console.error('Error fetching registrations:', error)
    // Continue with empty array if fetch fails
  }

  // Generate CSV data for export
  const csvData = registrations.map(reg => ({
    name: reg.participant_name,
    email: reg.participant_email,
    status: reg.status,
    registered_at: new Date(reg.registered_at).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  }))

  const csvContent = [
    // CSV Header
    ['Name', 'Email', 'Status', 'Registered At'].join(','),
    // CSV Rows
    ...csvData.map(row => 
      [row.name, row.email, row.status, row.registered_at]
        .map(field => `"${field}"`) // Escape fields with quotes
        .join(',')
    )
  ].join('\n')

  const csvBase64 = Buffer.from(csvContent).toString('base64')
  const csvFileName = `${cohort.name.replace(/[^a-zA-Z0-9]/g, '_')}_registrations.csv`

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
            <li className="text-steward-dark font-bold">Registrations</li>
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-steward-dark">
                  {cohort.name}
                </h1>
                <p className="text-gray-600 font-medium mt-1">
                  Manage registrations and waitlist
                </p>
              </div>
            </div>

            {/* Export Button */}
            {registrations.length > 0 && (
              <a
                href={`data:text/csv;base64,${csvBase64}`}
                download={csvFileName}
                className="inline-flex items-center gap-2 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-steward-dark bg-white border-2 border-gray-200 rounded-xl hover:border-steward-dark hover:bg-gray-50 transition-colors shadow-md hover:shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </a>
            )}
          </div>

          {/* Cohort Info */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  Status
                </div>
                <div className="text-lg font-black text-steward-dark capitalize">
                  {cohort.status}
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Registered
                </div>
                <div className="text-lg font-black text-steward-dark">
                  {cohort.registered_count}
                  {cohort.capacity && <span className="text-gray-400"> / {cohort.capacity}</span>}
                </div>
              </div>

              {cohort.waitlisted_count > 0 && (
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    Waitlisted
                  </div>
                  <div className="text-lg font-black text-yellow-600">
                    {cohort.waitlisted_count}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Registrant List Component */}
        <RegistrantList 
          cohortId={params.cohortId} 
          capacity={cohort.capacity}
        />
      </div>
    </div>
  )
}
