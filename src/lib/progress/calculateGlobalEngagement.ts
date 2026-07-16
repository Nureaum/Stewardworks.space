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
};

/**
 * Maximum engagement percentage cap.
 */
export const ENGAGEMENT_CAP = 25;

/**
 * Input type for engagement items - only requires kind and status fields
 * for the calculation (flexible to accept full WorkshopEngagement or minimal objects)
 */
export type EngagementItem = Pick<WorkshopEngagement, 'kind' | 'status'>;

/**
 * Calculates the global engagement percentage from an array of engagement items.
 * 
 * This function aggregates ALL approved engagement items across ALL cohorts.
 * Point values: bookmark = 1%, note = 1%, generation = 2%, prompt = 3%
 * The total is capped at 25%.
 * 
 * @param engagements - Array of engagement items (only needs kind and status fields)
 * @returns The engagement percentage (0-25)
 * 
 * @example
 * const engagements = [
 *   { kind: 'bookmark', status: 'approved' },
 *   { kind: 'prompt', status: 'approved' },
 *   { kind: 'note', status: 'pending' }, // Not counted - pending
 * ];
 * calculateGlobalEngagement(engagements); // Returns 4 (1 + 3)
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 */
export function calculateGlobalEngagement(engagements: EngagementItem[]): number {
  const totalPoints = engagements
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => sum + (ENGAGEMENT_POINT_VALUES[e.kind] ?? 0), 0);

  return Math.min(totalPoints, ENGAGEMENT_CAP);
}
