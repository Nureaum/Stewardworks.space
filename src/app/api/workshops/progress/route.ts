import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get active cohort (most recent open/completed)
    const { data: activeCohort } = await supabase
      .from('cohorts')
      .select('id')
      .in('status', ['open', 'completed'])
      .order('start_date', { ascending: false })
      .limit(1)
      .single()

    if (!activeCohort) {
      return NextResponse.json({ 
        progressRows: [],
        engagements: []
      })
    }

    // Get workshop days for this cohort
    const { data: days } = await supabase
      .from('workshop_days')
      .select('id')
      .eq('cohort_id', activeCohort.id)

    const dayIds = (days || []).map(d => d.id)

    // Get progress rows (same query as journey page)
    const { data: progressRows } = dayIds.length > 0
      ? await supabase
          .from('workshop_progress')
          .select('*')
          .eq('profile_id', profile.id)
          .in('workshop_day_id', dayIds)
      : { data: [] }

    // Get engagements (same query as journey page)
    const { data: engagements } = await supabase
      .from('workshop_engagement')
      .select('*')
      .eq('cohort_id', activeCohort.id)
      .eq('profile_id', profile.id)

    return NextResponse.json({
      progressRows: progressRows || [],
      engagements: engagements || []
    })
  } catch (error) {
    console.error('Error fetching workshop progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
