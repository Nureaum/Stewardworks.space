import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import AILabClient from '@/components/workshops/ai-lab/AILabClient';
import { getAILabCurriculum } from '@/app/actions/workshops/curriculum';
import { getWorkshopDashboard } from '@/app/actions/workshops/participants';
import { auth } from '@clerk/nextjs/server';

import { getWorkshopDays } from '@/app/actions/workshops/workshop-days';
import { getPrinciples } from '@/app/actions/workshops/principles';

export default async function AiLabPage({ searchParams }: { searchParams?: { cohortId?: string } }) {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  const supabase = createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, onboarding_completed, community_status')
    .eq('clerk_user_id', userId)
    .single();

  if (!profile) redirect('/onboarding');

  // Check if onboarding is completed (either by flag or legacy community_status field)
  const onboardingDone = profile.onboarding_completed === true || !!profile.community_status;
  if (!onboardingDone) {
    redirect(`/hub/onboarding?returnUrl=${encodeURIComponent('/hub/ai-lab')}`);
  }

  let activeCohort;
  
  if (searchParams?.cohortId) {
    const { data } = await supabase
      .from('cohorts')
      .select('id')
      .eq('id', searchParams.cohortId)
      .single();
    activeCohort = data;
  }
  
  // Only fall back to finding another cohort if no cohortId was provided
  if (!activeCohort && !searchParams?.cohortId) {
    const { data } = await supabase
      .from('cohorts')
      .select('id')
      .in('status', ['open', 'completed'])  // Only open/completed, not draft/planned
      .order('start_date', { ascending: false })
      .limit(1)
      .single();
    activeCohort = data;
  }
  
  // If cohortId was provided but not found, redirect back to workshops
  if (!activeCohort && searchParams?.cohortId) {
    redirect('/hub/pilot-workshops');
  }

  let daysComplete = 0;
  let approvedDays = 0;
  let days = [];
  let principles = [];
  let userCharacter = null;
  let dashboard: any[] = [];
  let submissions: any[] = [];
  let bankedPrinciples: any[] = [];
  
  if (activeCohort) {
    const { data: charData } = await supabase
        .from('workshop_characters')
        .select('*')
        .eq('cohort_id', activeCohort.id)
        .eq('profile_id', profile.id)
        .maybeSingle();
      if (charData) userCharacter = charData;
    try {
      dashboard = await getWorkshopDashboard(activeCohort.id);
      daysComplete = dashboard.filter(
        d => d.progress && (d.progress.deliverable_status === 'submitted' || d.progress.deliverable_status === 'approved')
      ).length;
      
      approvedDays = dashboard.filter(
        d => d.progress && d.progress.deliverable_status === 'approved'
      ).length;

      days = await getWorkshopDays(activeCohort.id);
      principles = await getPrinciples(activeCohort.id);
      
      // Fetch submissions for this user in this cohort
      const dayIds = days.map((d: any) => d.id);
      if (dayIds.length > 0) {
        const { data: subData } = await supabase
          .from('workshop_deliverable_submissions')
          .select('*')
          .in('workshop_day_id', dayIds)
          .eq('profile_id', profile.id)
          .order('submitted_at', { ascending: false });
        if (subData) submissions = subData;
      }
      
      // Fetch principles for SUBMITTED + APPROVED rows to detect pending states
      const activeProgressIds = dashboard
        .filter(d => d.progress && (d.progress.deliverable_status === 'approved' || d.progress.deliverable_status === 'submitted'))
        .map(d => d.progress.id);
      if (activeProgressIds.length > 0) {
        const { data: bpData } = await supabase
          .from('workshop_progress_principles')
          .select('*')
          .in('progress_id', activeProgressIds)
          .order('banked_at', { ascending: false });
        if (bpData) bankedPrinciples = bpData;
      }
    } catch (e) {
      console.error('Failed to get workshop dashboard for ai-lab:', e);
    }
  }

  const curriculum = await getAILabCurriculum(activeCohort?.id);

  let showcaseItems = [];
  let initialEngagements = [];
  let platforms = [];

  if (activeCohort) {
    const { data: sData } = await supabase
      .from('workshop_showcase')
      .select('*')
      .eq('cohort_id', activeCohort.id)
      .order('created_at', { ascending: false });
    if (sData) showcaseItems = sData;

    // Get engagements - GLOBAL (not filtered by cohort)
    // Engagement contributes 25% to progress and is shared across all cohorts
    const { data: eData } = await supabase
      .from('workshop_engagement')
      .select('*')
      .eq('profile_id', profile.id);
    if (eData) initialEngagements = eData;

    // Get platforms for the sandbox tabs
    const { data: pData } = await supabase
      .from('workshop_platforms')
      .select('*')
      .eq('cohort_id', activeCohort.id)
      .order('sort_order', { ascending: true });
    if (pData) platforms = pData;
  }
  return <AILabClient 
    initialCurriculum={curriculum || {}} 
    daysComplete={daysComplete} 
    approvedDays={approvedDays}
    cohortId={activeCohort?.id}
    days={days}
    principles={principles}
    userRole={profile.role}
    showcaseItems={showcaseItems}
    initialEngagements={initialEngagements}
    userCharacter={userCharacter}
    dashboard={dashboard}
    submissions={submissions}
    bankedPrinciples={bankedPrinciples}
    platforms={platforms}
  />;
}


