import { getWorkshopDashboard } from '@/app/actions/workshops/participants'
import { redirect } from 'next/navigation'
import TopicViewer from '@/components/workshops/TopicViewer'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function TopicPage({
  params,
}: {
  params: { cohortId: string; dayNumber: string; mediaId: string }
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

    const media = currentDay.media?.find(m => m.id === params.mediaId)

    if (!media) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Topic Not Found</h2>
            <p className="text-gray-500 mb-6">This topic does not exist or has been removed.</p>
            <Link
              href={`/hub/pilot-workshops/${params.cohortId}/day/${dayNum}`}
              className="inline-flex items-center justify-center w-full gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Day {dayNum}
            </Link>
          </div>
        </div>
      )
    }

    return (
      <TopicViewer 
        media={media} 
        cohortId={params.cohortId} 
        dayNumber={dayNum}
        dayTitle={currentDay.title}
        dayId={currentDay.id}
        dayMediaIds={currentDay.media?.map(m => m.id) || []}
      />
    )
  } catch (error) {
    redirect(`/hub/pilot-workshops/${params.cohortId}`)
  }
}
