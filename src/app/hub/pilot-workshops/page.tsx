import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CohortSelector from '@/components/workshops/journey/CohortSelector'

export const metadata = {
  title: 'The Steward\'s Journey | Pilot Workshops',
  description: 'A 3-day gamified workshop experience',
}

/**
 * Pilot Workshops — Main Student Entry Point
 * 
 * Shows a list of cohorts the student is registered in, 
 * plus any open cohorts they can join.
 */
export default async function PilotWorkshopsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  const supabase = createServerSupabaseClient()

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, onboarding_completed, community_status')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Check if onboarding is completed (either by flag or legacy community_status field)
  const onboardingDone = profile.onboarding_completed === true || !!profile.community_status;
  if (!onboardingDone) {
    redirect(`/hub/onboarding?returnUrl=${encodeURIComponent('/hub/pilot-workshops')}`);
  }

  // Get all active cohorts (open or completed)
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('id, name, status, start_date, description')
    .in('status', ['open', 'completed'])
    .order('start_date', { ascending: false })

  // Get user's registrations
  const { data: registrations } = await supabase
    .from('workshop_registrations')
    .select('id, cohort_id, status')
    .eq('profile_id', profile.id)

  return (
    <CohortSelector 
      cohorts={cohorts || []} 
      registrations={registrations || []} 
    />
  )
}
