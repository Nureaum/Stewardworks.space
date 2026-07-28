import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import JourneyClient from '../../JourneyClient'

interface Props {
  params: { cohortId: string }
  searchParams?: { tab?: string, mode?: string, section?: string }
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

  // Parallel fetch: registration, character, days, principles, engagement, showcase
  const [
    { data: registration },
    { data: character },
    { data: days },
    { data: principles },
    { data: initialEngagements },
    { data: showcaseItems },
  ] = await Promise.all([
    supabase
      .from('workshop_registrations')
      .select('id, status')
      .eq('cohort_id', cohortId)
      .eq('profile_id', profile.id)
      .single(),
    supabase
      .from('workshop_characters')
      .select('*')
      .eq('cohort_id', cohortId)
      .eq('profile_id', profile.id)
      .single(),
    supabase
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
      .order('day_number'),
    supabase
      .from('workshop_principles')
      .select('*')
      .eq('cohort_id', cohortId)
      .order('sort_order'),
    supabase
      .from('workshop_engagement')
      .select('*')
      .eq('profile_id', profile.id),
    supabase
      .from('workshop_showcase')
      .select('*')
      .eq('cohort_id', cohortId)
      .order('created_at', { ascending: false }),
  ])

  if (!isAdmin && (!registration || registration.status !== 'registered')) {
    redirect(`/hub/pilot-workshops`)
  }

  // Get progress for all days (depends on days result)
  const dayIds = (days || []).map((d: any) => d.id)
  const [{ data: progressRows }, { data: submissions }] = await Promise.all([
    dayIds.length > 0
      ? supabase
          .from('workshop_progress')
          .select('*')
          .eq('profile_id', profile.id)
          .in('workshop_day_id', dayIds)
      : Promise.resolve({ data: [] as any[] }),
    dayIds.length > 0
      ? supabase
          .from('workshop_deliverable_submissions')
          .select('*')
          .eq('profile_id', profile.id)
          .in('workshop_day_id', dayIds)
          .order('submitted_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
  ])

  // Compute principle IDs from progress
  const approvedProgressIds = (progressRows || [])
    .filter((p: any) => p.deliverable_status === 'approved')
    .map((p: any) => p.id)

  const activeProgressIds = (progressRows || [])
    .filter((p: any) => p.deliverable_status === 'submitted' || p.deliverable_status === 'approved')
    .map((p: any) => p.id)

  // Fetch banked principles in parallel
  const [{ data: bankedPrinciples }, { data: allBankedPrinciples }] = await Promise.all([
    approvedProgressIds.length > 0
      ? supabase
          .from('workshop_progress_principles')
          .select('*')
          .in('progress_id', approvedProgressIds)
          .order('banked_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    activeProgressIds.length > 0
      ? supabase
          .from('workshop_progress_principles')
          .select('*')
          .in('progress_id', activeProgressIds)
          .order('banked_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
  ])

  // Sort sections and entries by sort_order so dragged order persists on reload
  const sortedDays = (days || []).map((day: any) => ({
    ...day,
    sections: (day.sections || [])
      .sort((a: any, b: any) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
      .map((section: any) => ({
        ...section,
        entries: (section.entries || [])
          .sort((a: any, b: any) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999)),
      })),
  }))


  return (
    <JourneyClient
      cohortId={cohortId}
      cohortName={cohort.name}
      cohort={cohort}
      character={character || null}
      days={sortedDays}
      progressRows={progressRows || []}
      principles={principles || []}
      bankedPrinciples={bankedPrinciples || []}
      allBankedPrinciples={allBankedPrinciples || []}
      initialEngagements={initialEngagements || []}
      showcaseItems={showcaseItems || []}
      submissions={submissions || []}
      isAdmin={isAdmin}
      profileId={profile.id}
      userRole={profile.role}
      initialTab={(searchParams?.tab as any) || 'journey'}
      initialRole={(searchParams?.mode as any) || 'student'}
      initialSection={searchParams?.section}
    />
  )
}
