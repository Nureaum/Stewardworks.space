'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function joinCohort(formData: FormData) {
  const cohortId = formData.get('cohortId') as string
  if (!cohortId) {
    throw new Error('Cohort ID is required')
  }

  const { userId } = await auth()
  if (!userId) {
    redirect('/login')
  }

  const supabase = createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Check if already registered
  const { data: existingReg } = await supabase
    .from('workshop_registrations')
    .select('id')
    .eq('cohort_id', cohortId)
    .eq('profile_id', profile.id)
    .maybeSingle()

  if (!existingReg) {
    // Auto-register
    await supabase
      .from('workshop_registrations')
      .insert({
        cohort_id: cohortId,
        profile_id: profile.id,
        status: 'registered',
      })
  }

  redirect(`/hub/pilot-workshops/${cohortId}/journey`)
}
