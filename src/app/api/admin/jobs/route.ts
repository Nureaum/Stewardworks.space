import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'

async function verifyAdmin() {
  const { userId } = await auth()
  if (!userId) return { authorized: false, status: 401 }

  const supabase = createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()
  
  if (profile?.role === 'admin' || profile?.role === 'super_admin') {
    return { authorized: true, supabase, profileId: profile.id }
  }
  return { authorized: false, status: 403 }
}

export async function GET(request: Request) {
  const { authorized, status, supabase } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const { data, error } = await supabase
    .from('job_profiles')
    .select(`
      *,
      job_profile_steps (*)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}

export async function POST(request: Request) {
  const { authorized, status, supabase, profileId } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const body = await request.json()
  const { steps, ...jobData } = body

  const payload = {
    ...jobData,
    created_by: profileId,
    updated_by: profileId
  }

  // 1. Create Job Profile
  const { data: job, error: jobError } = await supabase
    .from('job_profiles')
    .insert(payload)
    .select()
    .single()

  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 })

  // 2. Insert Steps
  if (steps && Array.isArray(steps) && steps.length > 0) {
    const stepsPayload = steps.map((step: any, index: number) => ({
      job_profile_id: job.id,
      step_number: index + 1,
      description: step.description
    }))

    const { error: stepsError } = await supabase
      .from('job_profile_steps')
      .insert(stepsPayload)

    if (stepsError) {
      // In a real app we'd roll back, but here we just return the error
      return NextResponse.json({ error: 'Job created but failed to add steps: ' + stepsError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ item: job })
}
