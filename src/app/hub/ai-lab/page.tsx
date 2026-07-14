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
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single();

  if (!profile) redirect('/onboarding');

  let activeCohort;
  
  if (searchParams?.cohortId) {
    const { data } = await supabase
      .from('cohorts')
      .select('id')
      .eq('id', searchParams.cohortId)
      .single();
    activeCohort = data;
  }
  
  if (!activeCohort) {
    const { data } = await supabase
      .from('cohorts')
      .select('id')
      .in('status', ['open', 'completed', 'draft', 'planned'])
      .order('start_date', { ascending: false })
      .limit(1)
      .single();
    activeCohort = data;
  }

  let daysComplete = 0;
  let approvedDays = 0;
  let days = [];
  let principles = [];
  if (activeCohort) {
    try {
      const dashboard = await getWorkshopDashboard(activeCohort.id);
      daysComplete = dashboard.filter(
        d => d.progress && (d.progress.deliverable_status === 'submitted' || d.progress.deliverable_status === 'approved')
      ).length;
      
      approvedDays = dashboard.filter(
        d => d.progress && d.progress.deliverable_status === 'approved'
      ).length;

      days = await getWorkshopDays(activeCohort.id);
      principles = await getPrinciples(activeCohort.id);
    } catch (e) {
      console.error('Failed to get workshop dashboard for ai-lab:', e);
    }
  }

  const curriculum = await getAILabCurriculum();

  let showcaseItems = [];
  let initialEngagements = [];

  if (activeCohort) {
    const { data: sData } = await supabase
      .from('workshop_showcase')
      .select('*')
      .eq('cohort_id', activeCohort.id)
      .order('created_at', { ascending: false });
    if (sData) showcaseItems = sData;

    const { data: eData } = await supabase
      .from('workshop_engagement')
      .select('*')
      .eq('cohort_id', activeCohort.id)
      .eq('profile_id', profile.id);
    if (eData) initialEngagements = eData;
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
  />;
}
