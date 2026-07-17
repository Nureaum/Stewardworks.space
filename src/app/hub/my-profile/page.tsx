import ClientProfile from './ClientProfile';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { calculateGlobalEngagement, calculateCohortDeliverables } from '@/lib/progress';
import type { WorkshopEngagement, WorkshopProgress, WorkshopCharacter } from '@/types/workshops';

export const dynamic = 'force-dynamic';

// Type for cohort progress data
export interface CohortProgressData {
  cohortId: string;
  cohortName: string;
  chiaProgress: number;
  deliverableProgress: number;
  engagementProgress: number;
  isEligibleForCertificate: boolean;
  workshopDays?: any[];  // Days for this cohort (needed for certificate)
  progressRows?: any[];  // Progress for this cohort (needed for certificate)
}

export default async function MyProfilePage() {
  const { userId } = await auth();
  let initialProfile = null;
  let chiaProgress = 0;
  let engagementProgress = 0;
  let workshopDays: any[] = [];
  let progressRows: any[] = [];
  let submissions: any[] = [];
  let activeCohortId: string | null = null;
  let allCohortProgress: CohortProgressData[] = [];
  let workshopCharacter: WorkshopCharacter | null = null;

  if (userId) {
    const supabase = createServerSupabaseClient();
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();
      
    if (profileData) {
      initialProfile = profileData;
      const profileId = profileData.id;

      try {
        // ============================================
        // STEP 1: Get all cohorts user is registered in
        // ============================================
        const { data: registrations, error: regError } = await supabase
          .from('workshop_registrations')
          .select(`
            cohort_id,
            cohorts!inner (
              id,
              name,
              start_date,
              status
            )
          `)
          .eq('profile_id', profileId)
          .eq('status', 'registered');

        if (regError) {
          console.error('[Profile] Registration query error:', regError);
        }

        console.log('[Profile] ========== DEBUG START ==========');
        console.log('[Profile] User ID:', userId);
        console.log('[Profile] Profile ID:', profileId);
        console.log('[Profile] Registrations found:', registrations?.length || 0);

        // ============================================
        // STEP 2: Get ALL engagements globally
        // ============================================
        const { data: allEngagements } = await supabase
          .from('workshop_engagement')
          .select('*')
          .eq('profile_id', profileId);

        const engagementItems = (allEngagements || []) as WorkshopEngagement[];
        const approvedEngagements = engagementItems.filter(e => e.status === 'approved');
        const globalEngPct = calculateGlobalEngagement(approvedEngagements);
        engagementProgress = globalEngPct;

        console.log('[Profile] Total engagements:', engagementItems.length);
        console.log('[Profile] Approved engagements:', approvedEngagements.length);
        console.log('[Profile] Global engagement %:', globalEngPct);

        // ============================================
        // STEP 3: Process each cohort
        // ============================================
        if (registrations && registrations.length > 0) {
          // Sort by start_date descending (most recent first)
          const sortedRegs = [...registrations].sort((a, b) => {
            const dateA = new Date((a.cohorts as any).start_date).getTime();
            const dateB = new Date((b.cohorts as any).start_date).getTime();
            return dateB - dateA;
          });

          for (const reg of sortedRegs) {
            const cohortData = reg.cohorts as any;
            const cohortId = reg.cohort_id;
            const cohortName = cohortData.name;

            console.log(`[Profile] --- Cohort: ${cohortName} (${cohortId}) ---`);

            // Get workshop_days for this cohort
            const { data: daysData, error: daysError } = await supabase
              .from('workshop_days')
              .select('id')
              .eq('cohort_id', cohortId);

            if (daysError) {
              console.error(`[Profile] Days query error for ${cohortName}:`, daysError);
            }

            const dayIds = (daysData || []).map((d: any) => d.id);
            console.log(`[Profile]   Workshop days: ${dayIds.length}`, dayIds);

            // Get progress rows for these days
            let cohortProgressRows: WorkshopProgress[] = [];
            if (dayIds.length > 0) {
              const { data: progressData, error: progressError } = await supabase
                .from('workshop_progress')
                .select('*')
                .eq('profile_id', profileId)
                .in('workshop_day_id', dayIds);

              if (progressError) {
                console.error(`[Profile] Progress query error for ${cohortName}:`, progressError);
              }

              cohortProgressRows = (progressData || []) as WorkshopProgress[];
              console.log(`[Profile]   Progress rows: ${cohortProgressRows.length}`);
              
              // Log each progress row
              cohortProgressRows.forEach((p, i) => {
                console.log(`[Profile]     Row ${i + 1}: day_id=${p.workshop_day_id}, status=${p.deliverable_status}`);
              });
            }

            // Calculate deliverable percentage
            const delivPct = calculateCohortDeliverables(cohortProgressRows);
            const totalProgress = Math.min(delivPct + globalEngPct, 100);

            console.log(`[Profile]   Deliverable %: ${delivPct}`);
            console.log(`[Profile]   Total %: ${totalProgress}`);

            // Fetch full workshop days data for this cohort (needed for certificate)
            const { data: cohortDaysData } = await supabase
              .from('workshop_days')
              .select('id, day_number, title, deliverable_title')
              .eq('cohort_id', cohortId)
              .order('day_number');

            allCohortProgress.push({
              cohortId,
              cohortName,
              chiaProgress: totalProgress,
              deliverableProgress: delivPct,
              engagementProgress: globalEngPct,
              // Certificate eligibility based on deliverables only (75% = all 3 deliverables approved)
              // Engagement (25%) does NOT affect certificate eligibility
              isEligibleForCertificate: delivPct >= 75,
              workshopDays: cohortDaysData || [],
              progressRows: cohortProgressRows,
            });

            // Set first cohort as active (for backwards compatibility)
            if (!activeCohortId) {
              activeCohortId = cohortId;
              chiaProgress = totalProgress;
              workshopDays = cohortDaysData || [];
              progressRows = cohortProgressRows;

              // Get submissions
              if (dayIds.length > 0) {
                const { data: subsData } = await supabase
                  .from('workshop_deliverable_submissions')
                  .select('*')
                  .eq('profile_id', profileId)
                  .in('workshop_day_id', dayIds)
                  .order('submitted_at', { ascending: false });
                submissions = subsData || [];
              }
            }
          }
        }

        // Fetch character data for the first eligible cohort (or active cohort)
        // The character is per-cohort, so we need to get it from the right cohort
        const eligibleCohorts = allCohortProgress.filter(c => c.isEligibleForCertificate);
        const characterCohortId = eligibleCohorts.length > 0 
          ? eligibleCohorts[0].cohortId 
          : activeCohortId;
        
        if (characterCohortId) {
          const { data: characterData } = await supabase
            .from('workshop_characters')
            .select('*')
            .eq('cohort_id', characterCohortId)
            .eq('profile_id', profileId)
            .maybeSingle();
          
          if (characterData) {
            workshopCharacter = characterData as WorkshopCharacter;
          }
        }

        console.log('[Profile] ========== FINAL RESULTS ==========');
        console.log('[Profile] All cohorts:', allCohortProgress.map(c => ({
          name: c.cohortName,
          deliv: c.deliverableProgress,
          eng: c.engagementProgress,
          total: c.chiaProgress,
          eligible: c.isEligibleForCertificate,
          daysCount: c.workshopDays?.length || 0,
          progressCount: c.progressRows?.length || 0,
        })));
        console.log('[Profile] Character:', workshopCharacter?.character_key || 'none');
        console.log('[Profile] workshopDays (props):', workshopDays?.length || 0);
        console.log('[Profile] ====================================');

      } catch (error) {
        console.error('[Profile] Error:', error);
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
      allCohortProgress={allCohortProgress}
      workshopCharacter={workshopCharacter}
    />
  );
}
