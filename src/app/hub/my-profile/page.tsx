import ClientProfile from './ClientProfile';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// Engagement percentage values (same as Portfolio component)
const ENGPCT: Record<string, number> = {
  bookmark: 1,
  note: 1,
  generation: 2,
  prompt: 3,
};

export default async function MyProfilePage() {
  const { userId } = await auth();
  let initialProfile = null;
  let chiaProgress = 0;
  let engagementProgress = 0;
  let workshopDays: any[] = [];
  let progressRows: any[] = [];
  let submissions: any[] = [];
  let activeCohortId: string | null = null;

  if (userId) {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();
      
    if (data) {
      initialProfile = data;

      // Fetch workshop progress data to calculate chia growth (EXACT same as Portfolio)
      try {
        // Get active cohort (most recent open/completed)
        const { data: activeCohort } = await supabase
          .from('cohorts')
          .select('id')
          .in('status', ['open', 'completed'])
          .order('start_date', { ascending: false })
          .limit(1)
          .single();

        if (activeCohort) {
          activeCohortId = activeCohort.id;
          
          // Get workshop days for this cohort with full info
          const { data: days } = await supabase
            .from('workshop_days')
            .select('id, day_number, title, deliverable_title')
            .eq('cohort_id', activeCohort.id)
            .order('day_number');

          workshopDays = days || [];
          const dayIds = workshopDays.map(d => d.id);

          // Get progress rows - query ALL progress rows for this profile in this cohort's days
          let progData: any[] = [];
          if (dayIds.length > 0) {
            const { data: pd, error: pdError } = await supabase
              .from('workshop_progress')
              .select('*')
              .eq('profile_id', data.id)
              .in('workshop_day_id', dayIds);
            
            if (pdError) {
              console.error('[Profile Page] Error fetching progress rows:', pdError);
            }
            progData = pd || [];
          }
          
          progressRows = progData;

          // Get user's deliverable submissions
          let submissionsData: any[] = [];
          if (dayIds.length > 0) {
            const { data: sd } = await supabase
              .from('workshop_deliverable_submissions')
              .select('*')
              .eq('profile_id', data.id)
              .in('workshop_day_id', dayIds)
              .order('submitted_at', { ascending: false });
            submissionsData = sd || [];
          }
          
          submissions = submissionsData;

          // Get engagements for this cohort
          const { data: engagements, error: engError } = await supabase
            .from('workshop_engagement')
            .select('*')
            .eq('cohort_id', activeCohort.id)
            .eq('profile_id', data.id);
          
          if (engError) {
            console.error('[Profile Page] Error fetching engagements:', engError);
          }

          // Calculate chia progress EXACTLY as Portfolio component does
          const approvedDeliverables = progressRows.filter(
            (p: any) => p.deliverable_status === 'approved'
          ).length;
          
          const delivPct = Math.min(approvedDeliverables * 25, 75);
          
          const engPct = Math.min(
            (engagements || [])
              .filter((e: any) => e.status === 'approved')
              .reduce((a: number, e: any) => a + (ENGPCT[e.kind] || 0), 0),
            25,
          );
          
          chiaProgress = Math.min(delivPct + engPct, 100);
          engagementProgress = engPct;
          
          // Debug logging
          console.log('[Profile Page] === CHIA PROGRESS DEBUG ===');
          console.log('[Profile Page] Cohort:', activeCohort.id);
          console.log('[Profile Page] Profile:', data.id);
          console.log('[Profile Page] Days:', dayIds.length);
          console.log('[Profile Page] Progress rows:', progressRows.length);
          console.log('[Profile Page] Progress statuses:', progressRows.map((p: any) => p.deliverable_status));
          console.log('[Profile Page] Approved deliverables:', approvedDeliverables);
          console.log('[Profile Page] delivPct:', delivPct);
          console.log('[Profile Page] Engagements:', (engagements || []).length);
          console.log('[Profile Page] engPct:', engPct);
          console.log('[Profile Page] TOTAL chiaProgress:', chiaProgress);
          console.log('[Profile Page] ==============================');
        }
      } catch (error) {
        console.error('Error fetching workshop progress:', error);
      }
    }
  }

  return (
    <ClientProfile 
      initialProfile={initialProfile} 
      chiaProgress={chiaProgress} 
      engagementProgress={engagementProgress}
      workshopDays={workshopDays}
      progressRows={progressRows}
      submissions={submissions}
      activeCohortId={activeCohortId}
    />
  );
}
