import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/workshops/[cohortId]/submissions
 * Returns the current user's deliverable submission titles for a cohort.
 * Used by the certificate download to show actual user-provided titles.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { cohortId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const { cohortId } = params

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get workshop days for this cohort (ordered by day_number)
    const { data: days } = await supabase
      .from('workshop_days')
      .select('id, title, day_number')
      .eq('cohort_id', cohortId)
      .order('day_number', { ascending: true })

    if (!days || days.length === 0) {
      return NextResponse.json({ submissions: [] })
    }

    const dayIds = days.map(d => d.id)

    // Get user's deliverable submissions for these days
    const { data: submissions } = await supabase
      .from('workshop_deliverable_submissions')
      .select('id, workshop_day_id, title, submitted_at')
      .eq('profile_id', profile.id)
      .in('workshop_day_id', dayIds)
      .order('submitted_at', { ascending: false })

    // Build response: one entry per day with the latest submission title
    const result = days.map(day => {
      // Get the latest submission for this day
      const sub = (submissions || []).find(s => s.workshop_day_id === day.id)
      return {
        day_number: day.day_number,
        day_title: day.title,
        title: sub?.title || null,
        workshop_day_id: day.id
      }
    })

    return NextResponse.json({ submissions: result })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
