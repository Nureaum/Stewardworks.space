/**
 * Progress calculation utilities for the Multi-Cohort Chia Progress System
 * 
 * This module provides pure calculation functions for:
 * - Global engagement (25% max) - aggregated across all cohorts
 * - Cohort deliverables (75% max) - isolated per cohort
 * - Combined progress (100% max) - deliverables + engagement
 */

export {
  calculateGlobalEngagement,
  ENGAGEMENT_POINT_VALUES,
  ENGAGEMENT_CAP,
  type EngagementItem,
} from './calculateGlobalEngagement'

export {
  calculateCohortDeliverables,
  calculateCohortDeliverablesFromPartial,
  POINTS_PER_DELIVERABLE,
  MAX_DELIVERABLE_PERCENTAGE,
  MAX_DELIVERABLES,
} from './calculateCohortDeliverables'

export {
  calculateCombinedProgress,
  getChiaStage,
  getChiaStageName,
  CHIA_STAGE_NAMES,
  MAX_DELIVERABLE_CONTRIBUTION,
  MAX_ENGAGEMENT_CONTRIBUTION,
  type ChiaStage,
  type CombinedProgressResult,
} from './calculateCombinedProgress'
