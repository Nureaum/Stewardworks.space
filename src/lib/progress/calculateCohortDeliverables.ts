/**
 * Calculates deliverable progress percentage for a specific cohort.
 * 
 * This is a pure calculation utility that accepts an array of progress rows
 * (already filtered to a specific cohort) and returns the deliverable percentage.
 * 
 * Formula: 25% per approved deliverable, maximum 75% (3 deliverables)
 * 
 * @param progressRows - Array of workshop progress records for a single cohort
 * @returns Deliverable percentage (0-75)
 * 
 * @example
 * // 2 approved deliverables = 50%
 * calculateCohortDeliverables([
 *   { deliverable_status: 'approved', ... },
 *   { deliverable_status: 'approved', ... },
 *   { deliverable_status: 'submitted', ... }
 * ]) // returns 50
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import type { WorkshopProgress } from '@/types/workshops'

/**
 * Points per approved deliverable
 */
const POINTS_PER_DELIVERABLE = 25

/**
 * Maximum deliverable percentage (3 deliverables × 25%)
 */
const MAX_DELIVERABLE_PERCENTAGE = 75

/**
 * Maximum number of deliverables that count toward progress
 */
const MAX_DELIVERABLES = 3

export function calculateCohortDeliverables(progressRows: WorkshopProgress[]): number {
  // Count only approved deliverables
  const approvedCount = progressRows.filter(
    (row) => row.deliverable_status === 'approved'
  ).length

  // Cap at MAX_DELIVERABLES to prevent exceeding 75%
  const cappedCount = Math.min(approvedCount, MAX_DELIVERABLES)

  // Calculate percentage: 25% per deliverable, max 75%
  return cappedCount * POINTS_PER_DELIVERABLE
}

/**
 * Calculates deliverable progress from a subset of WorkshopProgress fields.
 * Useful when working with partial data or API responses that don't include
 * all WorkshopProgress fields.
 * 
 * @param progressRows - Array of objects with at least deliverable_status field
 * @returns Deliverable percentage (0-75)
 */
export function calculateCohortDeliverablesFromPartial(
  progressRows: Array<Pick<WorkshopProgress, 'deliverable_status'>>
): number {
  const approvedCount = progressRows.filter(
    (row) => row.deliverable_status === 'approved'
  ).length

  const cappedCount = Math.min(approvedCount, MAX_DELIVERABLES)
  
  return cappedCount * POINTS_PER_DELIVERABLE
}

// Export constants for testing and external use
export { POINTS_PER_DELIVERABLE, MAX_DELIVERABLE_PERCENTAGE, MAX_DELIVERABLES }
