import { EngagementKind, WorkshopEngagement } from '@/types/workshops';

/**
 * Point values for each engagement kind.
 * - bookmark: 1%
 * - note: 1%
 * - generation: 2%
 * - prompt: 3%
 */
export const ENGAGEMENT_POINT_VALUES: Record<EngagementKind, number> = {
  bookmark: 1,
  note: 1,
  generation: 2,
  prompt: 3,
  env_suggestion: 2,
  wf_suggestion: 2,
  lib_suggestion: 2,
};

/**
 * Maximum engagement percentage cap.
 */
export const ENGAGEMENT_CAP = 25;

/**
 * Input type for engagement items - only requires kind and status fields
 * for the calculation (flexible to accept full WorkshopEngagement or minimal objects)
 */
export type EngagementItem = Pick<WorkshopEngagement, 'kind' | 'status'> & { content?: string | null };

/**
 * Calculates the global engagement percentage from an array of engagement items.
 * 
 * This function aggregates ALL approved engagement items across ALL cohorts.
 * Point values: bookmark = 1%, note = 1%, generation = 2%, prompt = 3%
 * The total is capped at 25%.
 * Showcase bonus: +1% if showcaseVisible is true in content.
 * 
 * @param engagements - Array of engagement items
 * @returns The engagement percentage (0-25)
 */
export function calculateGlobalEngagement(engagements: EngagementItem[]): number {
  const totalPoints = engagements
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => {
      let points = ENGAGEMENT_POINT_VALUES[e.kind] ?? 0;
      
      // Add +1% bonus if it's approved and showcaseVisible is true
      if (e.content) {
        try {
          const contentData = JSON.parse(e.content);
          // Only award if it actually made it to the showcase, OR if it's a legacy check where
          // we might just assume showcaseRequested + approved means it's showcased.
          if (contentData.showcaseVisible === true || (contentData.showcaseRequested === true)) {
            points += 1;
          }
        } catch (err) {
          // ignore parsing errors
        }
      }
      
      return sum + points;
    }, 0);

  return Math.min(totalPoints, ENGAGEMENT_CAP);
}
