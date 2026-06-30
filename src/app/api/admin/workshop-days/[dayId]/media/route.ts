import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { dayId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabaseClient()
    
    // Get user profile and verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    if (!['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get media for this workshop day
    const { data: media, error: mediaError } = await supabase
      .from('workshop_day_media')
      .select('*')
      .eq('workshop_day_id', params.dayId)
      .order('sort_order', { ascending: true })

    if (mediaError) {
      console.error('Get media error:', mediaError)
      return NextResponse.json(
        { error: 'Failed to fetch media' },
        { status: 500 }
      )
    }

    return NextResponse.json({ media: media || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
