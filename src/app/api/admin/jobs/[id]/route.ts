import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { authorized, status, supabase } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const { data, error } = await supabase
    .from('job_profiles')
    .select(`
      *,
      job_profile_steps (*)
    `)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { authorized, status, supabase, profileId } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const body = await request.json()
  const { steps, ...jobData } = body

  const payload = {
    ...jobData,
    updated_by: profileId,
    updated_at: new Date().toISOString()
  }

  // 1. Update Job Profile
  const { data: job, error: jobError } = await supabase
    .from('job_profiles')
    .update(payload)
    .eq('id', params.id)
    .select()
    .single()

  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 })

  // 2. Replace Steps (Delete old ones, insert new ones)
  await supabase.from('job_profile_steps').delete().eq('job_profile_id', params.id)

  if (steps && Array.isArray(steps) && steps.length > 0) {
    const stepsPayload = steps.map((step: any, index: number) => ({
      job_profile_id: params.id,
      step_number: index + 1,
      description: step.description
    }))

    const { error: stepsError } = await supabase
      .from('job_profile_steps')
      .insert(stepsPayload)

    if (stepsError) {
      return NextResponse.json({ error: 'Job updated but failed to update steps: ' + stepsError.message }, { status: 500 })
    }
  }

  revalidatePath('/hub/workforce-pathways', 'layout')
  
  return NextResponse.json({ item: job })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { authorized, status, supabase } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  // Soft delete
  const { error } = await supabase
    .from('job_profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  revalidatePath('/hub/workforce-pathways', 'layout')
  
  return NextResponse.json({ success: true })
}
