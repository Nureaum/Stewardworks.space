/**
 * Combined Progress Calculator for Multi-Cohort Chia Progress System
 * 
 * Combines cohort-specific deliverables (0-75%) with global engagement (0-25%)
 * to produce a total Chia Guardian progress percentage (0-100%).
 * 
 * Also provides Chia growth stage selection based on the combined percentage.
 * 
 * Requirements: 3.1, 3.3
 */

/**
 * Chia growth stages corresponding to progress thresholds.
 * Stage 0: Bare bud (0%)
 * Stage 1: Sprouting (1-24%)
 * Stage 2: Filling in (25-49%)
 * Stage 3: Leafy crown (50-74%)
 * Stage 4: Lush mane (75-99%)
 * Stage 5: Full bloom (100%)
 */
export type ChiaStage = 0 | 1 | 2 | 3 | 4 | 5;

export const CHIA_STAGE_NAMES: Record<ChiaStage, string> = {
  0: 'Bare bud',
  1: 'Sprouting',
  2: 'Filling in',
  3: 'Leafy crown',
  4: 'Lush mane',
  5: 'Full bloom',
};

/**
 * Maximum deliverable percentage contribution
 */
export const MAX_DELIVERABLE_CONTRIBUTION = 75;

/**
 * Maximum engagement percentage contribution
 */
export const MAX_ENGAGEMENT_CONTRIBUTION = 25;

/**
 * Result of combined progress calculation
 */
export interface CombinedProgressResult {
  /** Total progress percentage (0-100) */
  totalPercentage: number;
  /** Chia growth stage (0-5) */
  chiaStage: ChiaStage;
  /** Human-readable stage name */
  stageName: string;
}

/**
 * Calculates the combined Chia progress from deliverables and engagement.
 * 
 * Formula: Combined = Deliverables (0-75) + Engagement (0-25)
 * 
 * @param deliverablesPercentage - Cohort deliverables percentage (0-75)
 * @param engagementPercentage - Global engagement percentage (0-25)
 * @returns Combined progress result with total percentage and Chia stage
 * 
 * @example
 * // 2 approved deliverables (50%) + 20% engagement = 70%
 * calculateCombinedProgress(50, 20); 
 * // Returns { totalPercentage: 70, chiaStage: 3, stageName: 'Leafy crown' }
 * 
 * **Validates: Requirements 3.1, 3.3**
 */
export function calculateCombinedProgress(
  deliverablesPercentage: number,
  engagementPercentage: number
): CombinedProgressResult {
  // Clamp inputs to valid ranges
  const clampedDeliverables = Math.max(0, Math.min(deliverablesPercentage, MAX_DELIVERABLE_CONTRIBUTION));
  const clampedEngagement = Math.max(0, Math.min(engagementPercentage, MAX_ENGAGEMENT_CONTRIBUTION));
  
  // Calculate combined total
  const totalPercentage = clampedDeliverables + clampedEngagement;
  
  // Get Chia stage
  const chiaStage = getChiaStage(totalPercentage);
  
  return {
    totalPercentage,
    chiaStage,
    stageName: CHIA_STAGE_NAMES[chiaStage],
  };
}

/**
 * Determines the Chia growth stage based on combined progress percentage.
 * 
 * Stage thresholds (per Property 7 from design):
 * - Stage 0 (Bare bud): P = 0
 * - Stage 1 (Sprouting): 0 < P < 25
 * - Stage 2 (Filling in): 25 ≤ P < 50
 * - Stage 3 (Leafy crown): 50 ≤ P < 75
 * - Stage 4 (Lush mane): 75 ≤ P < 100
 * - Stage 5 (Full bloom): P = 100
 * 
 * @param percentage - Combined progress percentage (0-100)
 * @returns Chia growth stage (0-5)
 * 
 * @example
 * getChiaStage(0);   // Returns 0 (Bare bud)
 * getChiaStage(10);  // Returns 1 (Sprouting)
 * getChiaStage(25);  // Returns 2 (Filling in)
 * getChiaStage(50);  // Returns 3 (Leafy crown)
 * getChiaStage(75);  // Returns 4 (Lush mane)
 * getChiaStage(100); // Returns 5 (Full bloom)
 * 
 * **Validates: Requirement 3.3**
 */
export function getChiaStage(percentage: number): ChiaStage {
  if (percentage === 100) return 5;
  if (percentage >= 75) return 4;
  if (percentage >= 50) return 3;
  if (percentage >= 25) return 2;
  if (percentage > 0) return 1;
  return 0;
}

/**
 * Gets the human-readable name for a Chia stage.
 * 
 * @param stage - Chia growth stage (0-5)
 * @returns Human-readable stage name
 */
export function getChiaStageName(stage: ChiaStage): string {
  return CHIA_STAGE_NAMES[stage];
}
