import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import JourneyClient from '../../JourneyClient'

interface Props {
  params: { cohortId: string }
  searchParams?: { tab?: string, mode?: string }
}

export default async function JourneyPage({ params, searchParams }: Props) {
  const { cohortId } = params
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  const supabase = createServerSupabaseClient()

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Get cohort
  const { data: cohort } = await supabase
    .from('cohorts')
    .select('*')
    .eq('id', cohortId)
    .single()

  if (!cohort) {
    redirect('/hub/pilot-workshops')
  }

  const isAdmin = profile.role === 'admin' || profile.role === 'super_admin'

  // Check registration
  const { data: registration } = await supabase
    .from('workshop_registrations')
    .select('id, status')
    .eq('cohort_id', cohortId)
    .eq('profile_id', profile.id)
    .single()

  if (!isAdmin && (!registration || registration.status !== 'registered')) {
    redirect(`/hub/pilot-workshops`)
  }

  // Get character (may be null if not yet created)
  const { data: character } = await supabase
    .from('workshop_characters')
    .select('*')
    .eq('cohort_id', cohortId)
    .eq('profile_id', profile.id)
    .single()

  // Get workshop days
  const { data: days } = await supabase
    .from('workshop_days')
    .select(`
      *,
      sections:workshop_day_sections (
        *,
        entries:workshop_day_entries (
          *
        )
      )
    `)
    .eq('cohort_id', cohortId)
    .order('day_number')

  // Get progress for all days
  const dayIds = (days || []).map(d => d.id)
  const { data: progressRows } = dayIds.length > 0
    ? await supabase
        .from('workshop_progress')
        .select('*')
        .eq('profile_id', profile.id)
        .in('workshop_day_id', dayIds)
    : { data: [] }

  // Get principles
  const { data: principles } = await supabase
    .from('workshop_principles')
    .select('*')
    .eq('cohort_id', cohortId)
    .order('sort_order')

  // APPROVED only — these principles are fully locked (counted in user's bank)
  const approvedProgressIds = (progressRows || [])
    .filter(p => p.deliverable_status === 'approved')
    .map(p => p.id)

  // SUBMITTED + APPROVED — used for pending detection in the principle picker
  const activeProgressIds = (progressRows || [])
    .filter(p => p.deliverable_status === 'submitted' || p.deliverable_status === 'approved')
    .map(p => p.id)

  console.log('[journey/page] progressRows:', progressRows?.map(p => ({ id: p.id, day: p.workshop_day_id, status: p.deliverable_status })))

  // bankedPrinciples = approved only (what's locked & counted in user's principle bank)
  const { data: bankedPrinciples } = approvedProgressIds.length > 0
    ? await supabase
        .from('workshop_progress_principles')
        .select('*')
        .in('progress_id', approvedProgressIds)
        .order('banked_at', { ascending: false })
    : { data: [] }

  // allBankedPrinciples = submitted + approved (used to detect pending principles in the picker)
  const { data: allBankedPrinciples } = activeProgressIds.length > 0
    ? await supabase
        .from('workshop_progress_principles')
        .select('*')
        .in('progress_id', activeProgressIds)
        .order('banked_at', { ascending: false })
    : { data: [] }

  console.log('[journey/page] bankedPrinciples (approved):', bankedPrinciples)
  console.log('[journey/page] allBankedPrinciples (submitted+approved):', allBankedPrinciples)

  // Get user's deliverable submissions
  const { data: submissions } = dayIds.length > 0
    ? await supabase
        .from('workshop_deliverable_submissions')
        .select('*')
        .eq('profile_id', profile.id)
        .in('workshop_day_id', dayIds)
        .order('submitted_at', { ascending: false })
    : { data: [] }

  // Get user's engagements - GLOBAL (not filtered by cohort)
  // Engagement contributes 25% to progress and is shared across all cohorts
  const { data: initialEngagements } = await supabase
    .from('workshop_engagement')
    .select('*')
    .eq('profile_id', profile.id)

  // Get showcase items
  const { data: showcaseItems } = await supabase
    .from('workshop_showcase')
    .select('*')
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: false })


  return (
    <JourneyClient
      cohortId={cohortId}
      cohortName={cohort.name}
      cohort={cohort}
      character={character || null}
      days={days || []}
      progressRows={progressRows || []}
      principles={principles || []}
      bankedPrinciples={bankedPrinciples || []}
      allBankedPrinciples={allBankedPrinciples || []}
      initialEngagements={initialEngagements || []}
      showcaseItems={showcaseItems || []}
      submissions={submissions || []}
      isAdmin={isAdmin}
      profileId={profile.id}
      initialTab={(searchParams?.tab as any) || 'journey'}
      initialRole={(searchParams?.mode as any) || 'student'}
    />
  )
}
