import { getWorkshopDashboard, getUserRegisteredCohorts } from '@/app/actions/workshops/participants'
import { getPublicCohort } from '@/app/actions/workshops/public'
import WorkshopDayStepper from '@/components/workshops/WorkshopDayStepper'
import CohortSelector from '@/components/workshops/CohortSelector'
import CohortHeroBanner from '@/components/workshops/CohortHeroBanner'
import { Calendar, ArrowLeft, AlertCircle, UserX, Clock, CheckCircle, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

/**
 * Error types for better error handling and user messaging
 */
type ErrorType = 
  | 'not_registered' 
  | 'waitlisted' 
  | 'not_found' 
  | 'authentication' 
  | 'network' 
  | 'unknown'

interface DashboardError {
  type: ErrorType
  message: string
  action?: {
    label: string
    href: string
  }
}

/**
 * Determines the error type from error message
 */
function categorizeError(error: unknown): DashboardError {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  
  // Not registered error
  if (message.includes('Not registered')) {
    return {
      type: 'not_registered',
      message: 'You are not registered for this workshop cohort.',
      action: {
        label: 'View Available Cohorts',
        href: '/hub/pilot-workshops'
      }
    }
  }
  
  // Waitlisted error
  if (message.includes('waitlisted')) {
    return {
      type: 'waitlisted',
      message: 'You are currently on the waitlist for this cohort. You\'ll be notified if a spot becomes available.',
      action: {
        label: 'View Other Cohorts',
        href: '/hub/pilot-workshops'
      }
    }
  }
  
  // Authentication error
  if (message.includes('Authentication required') || message.includes('Profile not found')) {
    return {
      type: 'authentication',
      message: 'Please sign in to access the workshop dashboard.',
      action: {
        label: 'Sign In',
        href: '/sign-in'
      }
    }
  }
  
  // Not found errors
  if (message.includes('not found') || message.includes('Cohort not found')) {
    return {
      type: 'not_found',
      message: 'This workshop cohort could not be found.',
      action: {
        label: 'Back to Workshops',
        href: '/hub/pilot-workshops'
      }
    }
  }
  
  // Network/database errors
  if (message.includes('Failed to fetch') || message.includes('network')) {
    return {
      type: 'network',
      message: 'Unable to load the workshop dashboard. Please check your connection and try again.',
      action: {
        label: 'Try Again',
        href: `/hub/pilot-workshops/${''}`
      }
    }
  }
  
  // Unknown errors
  return {
    type: 'unknown',
    message: message || 'An unexpected error occurred while loading the dashboard.',
    action: {
      label: 'Back to Workshops',
      href: '/hub/pilot-workshops'
    }
  }
}

/**
 * Error UI component for different error states
 */
function ErrorDisplay({ error, cohortId }: { error: DashboardError; cohortId?: string }) {
  const iconMap = {
    not_registered: UserX,
    waitlisted: Clock,
    not_found: AlertCircle,
    authentication: AlertCircle,
    network: AlertCircle,
    unknown: AlertCircle,
  }
  
  const colorMap = {
    not_registered: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', subtext: 'text-blue-700' },
    waitlisted: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', subtext: 'text-yellow-700' },
    not_found: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900', subtext: 'text-gray-700' },
    authentication: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', subtext: 'text-red-700' },
    network: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', subtext: 'text-orange-700' },
    unknown: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', subtext: 'text-red-700' },
  }
  
  const Icon = iconMap[error.type]
  const colors = colorMap[error.type]
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href="/hub/pilot-workshops"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Workshops
      </Link>

      {/* Error Display */}
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-8`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Icon className={`w-8 h-8 ${colors.subtext}`} />
          </div>
          <div className="flex-1">
            <h2 className={`text-xl font-semibold ${colors.text} mb-2`}>
              {error.type === 'not_registered' && 'Not Registered'}
              {error.type === 'waitlisted' && 'On Waitlist'}
              {error.type === 'not_found' && 'Workshop Not Found'}
              {error.type === 'authentication' && 'Authentication Required'}
              {error.type === 'network' && 'Connection Error'}
              {error.type === 'unknown' && 'Something Went Wrong'}
            </h2>
            <p className={`${colors.subtext} mb-4`}>{error.message}</p>
            
            {error.action && (
              <Link
                href={error.type === 'network' && cohortId ? `/hub/pilot-workshops/${cohortId}` : error.action.href}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${colors.text} hover:opacity-80 border ${colors.border} bg-white transition-opacity`}
              >
                {error.action.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function WorkshopDashboardPage({
  params,
  searchParams,
}: {
  params: { cohortId: string }
  searchParams: { registered?: string; status?: string }
}) {
  try {
    const [days, cohort, registeredCohorts] = await Promise.all([
      getWorkshopDashboard(params.cohortId),
      getPublicCohort(params.cohortId),
      getUserRegisteredCohorts(),
    ])

    if (!cohort) {
      redirect('/hub/pilot-workshops')
    }

    const startDate = new Date(cohort.start_date)
    const hasStarted = startDate <= new Date()

    // Check if user just registered (from query parameter)
    const justRegistered = searchParams.registered === 'true'
    const registrationStatus = searchParams.status as 'registered' | 'waitlisted' | undefined

    // Calculate completion progress
    const totalDays = days.length
    const completedDays = days.filter(d => d.progress?.deliverable_status === 'approved').length
    const progressPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

    return (
      <div className="min-h-screen bg-steward-offwhite py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="w-full">
            
            {/* Top Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-steward-green flex items-center justify-center">
                  <svg className="w-[15px] h-[15px] text-steward-offwhite" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 11a9 9 0 019 9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4a16 16 0 0116 16" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4a16 16 0 0016 16" />
                  </svg>
                </div>
                <span className="text-[15px] font-medium text-steward-dark">Stewardworks</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/hub/pilot-workshops"
                  className="flex items-center gap-1.5 bg-white border border-[#E3D6AC] px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-steward-dark hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to workshops
                </Link>
                {registeredCohorts.length > 1 ? (
                  <div className="bg-white border border-[#E3D6AC] rounded-full">
                    <CohortSelector cohorts={registeredCohorts} currentCohortId={params.cohortId} />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-white border border-[#E3D6AC] px-3.5 py-1.5 rounded-full text-[12.5px] font-medium text-steward-dark">
                    {cohort.name} <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>

            {/* Registration Confirmation */}
            {justRegistered && registrationStatus === 'registered' && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-800 font-medium">You are now registered for <strong>{cohort.name}</strong>!</p>
              </div>
            )}
            {justRegistered && registrationStatus === 'waitlisted' && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800 font-medium">You've been added to the waitlist for <strong>{cohort.name}</strong>.</p>
              </div>
            )}

            {/* Hero Banner (Client Component for dynamic progress) */}
            <CohortHeroBanner 
              cohortName={cohort.name}
              startDateString={startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              totalDays={totalDays}
              days={days}
              cohortId={params.cohortId}
            />

            {/* Progress Section */}
            <div className="flex items-center gap-2 mb-3.5">
              <CheckCircle className="w-[18px] h-[18px] text-steward-green" />
              <span className="text-base font-medium text-steward-dark">Your progress</span>
            </div>

            {/* Days Stepper Component */}
            <WorkshopDayStepper days={days} cohortId={params.cohortId} />

            {/* How It Works Section */}
            <div className="bg-steward-dark rounded-2xl p-6 mt-5">
              <div className="text-[11px] font-medium text-steward-orange uppercase tracking-wider mb-4">How it works</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-5">
                {[
                  "Complete each day in sequence",
                  "Review all assigned topics and content",
                  "Submit your deliverable to advance",
                  "Revisit completed days anytime"
                ].map((instruction, idx) => (
                  <div key={idx} className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-steward-blue text-steward-offwhite flex items-center justify-center text-[11px] font-medium flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-[12.5px] text-[#C9C4A8] leading-relaxed">
                      {instruction}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load dashboard'
    
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700 mb-4">{message}</p>
          <Link
            href="/hub/pilot-workshops"
            className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workshops
          </Link>
        </div>
      </div>
    )
  }
}
