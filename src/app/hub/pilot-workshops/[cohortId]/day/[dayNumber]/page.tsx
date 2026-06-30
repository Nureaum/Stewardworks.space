import { getWorkshopDashboard } from '@/app/actions/workshops/participants'
import { ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DayTopicsList from '@/components/workshops/DayTopicsList'
import DeliverableStatusBadge from '@/components/workshops/DeliverableStatusBadge'

export default async function WorkshopDayPage({
  params,
}: {
  params: { cohortId: string; dayNumber: string }
}) {
  const dayNum = parseInt(params.dayNumber)
  
  if (isNaN(dayNum) || dayNum < 1 || dayNum > 3) {
    redirect(`/hub/pilot-workshops/${params.cohortId}`)
  }

  try {
    const days = await getWorkshopDashboard(params.cohortId)
    const currentDay = days.find(d => d.day_number === dayNum)

    if (!currentDay) {
      redirect(`/hub/pilot-workshops/${params.cohortId}`)
    }

    // Server-side lock check removed - UI lock state is handled by localStorage on the dashboard

    return (
      <div className="min-h-screen bg-steward-offwhite py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto">
          
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-10">
            <Link
              href={`/hub/pilot-workshops/${params.cohortId}`}
              className="inline-flex items-center gap-2 text-sm text-steward-dark hover:opacity-80 transition-opacity font-bold uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-steward-dark mb-4 tracking-tight uppercase">
              {currentDay.title}
            </h1>
            <p className="text-gray-600 text-[15px] max-w-2xl mx-auto leading-relaxed">
              Complete the topics below to earn your completion badge for this day. Check back to review the material anytime.
            </p>
          </div>

          {/* Topics List (The UI) */}
          <DayTopicsList day={currentDay} cohortId={params.cohortId} />
          
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-steward-offwhite flex items-center justify-center p-6">
        <div className="bg-white border border-red-200 rounded-[18px] p-8 text-center max-w-md w-full shadow-sm">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Day</h2>
          <p className="text-gray-500 mb-6">We couldn't load this day's content.</p>
          <Link
            href={`/hub/pilot-workshops/${params.cohortId}`}
            className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 bg-steward-blue text-white rounded-xl hover:opacity-90 transition-opacity font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }
}
