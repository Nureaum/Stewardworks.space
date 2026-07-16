import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { WorkshopEngagement, WorkshopProgress, Cohort } from '@/types/workshops'
import { calculateGlobalEngagement, calculateCohortDeliverables } from '@/lib/progress'

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ============================================================
// Multi-Cohort Progress API Types
// ============================================================

/**
 * CohortProgress: Per-cohort deliverable progress data
 * Used in the cohortProgress array of ProgressAPIResponse
 */
export interface CohortProgress {
  cohortId: string
  cohortName: string
  startDate: string
  status: 'draft' | 'open' | 'closed' | 'completed'
  deliverables: {
    percentage: number        // 0-75
    approvedCount: number     // 0-3
    progressRows: WorkshopProgress[]
  }
}

/**
 * ProgressAPIResponse: Enhanced response interface for multi-cohort progress
 * 
 * Separates global engagement (25% max, same across all cohorts) from
 * per-cohort deliverables (75% max, independent per cohort).
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */
export interface ProgressAPIResponse {
  // Global engagement (same across all views)
  globalEngagement: {
    percentage: number          // 0-25
    approvedCount: number       // Number of approved engagement items
    pendingCount: number        // Number of pending items
    items: WorkshopEngagement[] // All engagement items (for Portfolio display)
  }

  // Per-cohort deliverables
  cohortProgress: CohortProgress[]

  // Currently selected cohort (default: most recent active)
  selectedCohortId: string

  // Combined total for selected cohort
  totalProgress: number         // deliverables + engagement (0-100)
}

/**
 * ProgressAPIRequest: Query parameters for the Progress API
 */
export interface ProgressAPIRequest {
  cohort_id?: string  // Optional: specific cohort to load, defaults to most recent
}

/**
 * UserCohort: Cohort info returned from user cohort list query
 */
interface UserCohort {
  id: string
  name: string
  start_date: string
  status: 'draft' | 'open' | 'closed' | 'completed'
}

/**
 * Gets all cohorts a user has participated in via workshop_registrations.
 * Returns cohorts ordered by start_date descending (most recent first).
 * Returns empty array if user has no cohort participation.
 * 
 * Validates: Requirements 4.2, 5.5
 */
async function getUserCohorts(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  profileId: string
): Promise<UserCohort[]> {
  // Query workshop_registrations joined with cohorts
  // Only include registered status (not waitlisted or cancelled)
  const { data: registrations, error } = await supabase
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
    .eq('status', 'registered')

  if (error) {
    console.error('Error fetching user cohorts:', error)
    return []
  }

  if (!registrations || registrations.length === 0) {
    return []
  }

  // Extract cohort data from joined results
  // Use a Map to deduplicate cohorts (in case of multiple registrations)
  const cohortMap = new Map<string, UserCohort>()
  
  for (const reg of registrations) {
    // The cohorts relation returns an object (due to !inner join)
    const cohort = reg.cohorts as unknown as UserCohort
    if (cohort && cohort.id) {
      cohortMap.set(cohort.id, {
        id: cohort.id,
        name: cohort.name,
        start_date: cohort.start_date,
        status: cohort.status
      })
    }
  }

  // Convert to array and sort by start_date descending (most recent first)
  const cohorts = Array.from(cohortMap.values())
  cohorts.sort((a, b) => {
    const dateA = new Date(a.start_date).getTime()
    const dateB = new Date(b.start_date).getTime()
    return dateB - dateA // Descending order
  })

  return cohorts
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get all cohorts user has participated in (Task 3.2)
    // Validates: Requirements 4.2, 5.5
    const userCohorts = await getUserCohorts(supabase, profile.id)

    // Handle case where user has no cohort participation (Requirement 5.5)
    if (userCohorts.length === 0) {
      const emptyResponse: ProgressAPIResponse = {
        globalEngagement: {
          percentage: 0,
          approvedCount: 0,
          pendingCount: 0,
          items: []
        },
        cohortProgress: [],
        selectedCohortId: '',
        totalProgress: 0
      }
      return NextResponse.json(emptyResponse)
    }

    // ============================================================
    // Task 3.7: cohort_id parameter handling
    // Validates: Requirements 5.1, 5.2
    // ============================================================
    const { searchParams } = new URL(request.url)
    const cohortIdParam = searchParams.get('cohort_id')
    
    let selectedCohortId: string
    
    if (cohortIdParam) {
      // Validate UUID format (return 400 if invalid)
      if (!UUID_REGEX.test(cohortIdParam)) {
        return NextResponse.json({ error: 'Invalid cohort ID' }, { status: 400 })
      }
      
      // Check if the cohort exists in user's cohort list
      const cohortExists = userCohorts.some(c => c.id === cohortIdParam)
      
      if (cohortExists) {
        // Valid cohort_id found in user's cohorts - use it
        selectedCohortId = cohortIdParam
      } else {
        // Cohort not found in user's list - fallback to most recent cohort (Requirement 5.2)
        selectedCohortId = userCohorts[0].id
      }
    } else {
      // No cohort_id provided - default to most recent cohort (Requirement 5.1)
      selectedCohortId = userCohorts[0].id
    }

    // ============================================================
    // Task 3.4: Global engagement aggregation
    // Get ALL engagements globally (no cohort filter)
    // Validates: Requirements 1.1, 5.3, 6.3
    // ============================================================
    const { data: allEngagements } = await supabase
      .from('workshop_engagement')
      .select('*')
      .eq('profile_id', profile.id)

    const engagementItems = (allEngagements || []) as WorkshopEngagement[]

    // Calculate global engagement percentage using Global Engagement Calculator
    const approvedEngagements = engagementItems.filter(e => e.status === 'approved')
    const pendingEngagements = engagementItems.filter(e => e.status === 'pending')
    const globalEngagementPercentage = calculateGlobalEngagement(approvedEngagements)

    // ============================================================
    // Task 3.5: Per-cohort deliverables query
    // Join workshop_progress with workshop_days to filter by cohort_id
    // Calculate deliverable percentage for each cohort
    // Validates: Requirements 2.1, 5.2, 5.4, 6.4
    // ============================================================
    const cohortProgress: CohortProgress[] = await Promise.all(
      userCohorts.map(async (cohort) => {
        // Get workshop_days for this cohort to enable the join pattern from design.md:
        // SELECT wp.* FROM workshop_progress wp
        // JOIN workshop_days wd ON wp.workshop_day_id = wd.id
        // WHERE wp.profile_id = :profile_id AND wd.cohort_id = :cohort_id
        const { data: workshopDays } = await supabase
          .from('workshop_days')
          .select('id')
          .eq('cohort_id', cohort.id)

        const dayIds = (workshopDays || []).map(d => d.id)

        // Get workshop_progress rows for this cohort's days
        // This correctly associates deliverables with cohorts via workshop_day_id (Requirement 6.4)
        const { data: progressRows } = dayIds.length > 0
          ? await supabase
              .from('workshop_progress')
              .select('*')
              .eq('profile_id', profile.id)
              .in('workshop_day_id', dayIds)
          : { data: [] }

        const cohortProgressRows = (progressRows || []) as WorkshopProgress[]
        
        // Calculate deliverable percentage using Cohort Deliverables Calculator (Requirements 2.1, 2.2)
        const deliverablePercentage = calculateCohortDeliverables(cohortProgressRows)
        
        // Count approved deliverables for the response
        const approvedCount = cohortProgressRows.filter(
          row => row.deliverable_status === 'approved'
        ).length

        return {
          cohortId: cohort.id,
          cohortName: cohort.name,
          startDate: cohort.start_date,
          status: cohort.status,
          deliverables: {
            percentage: deliverablePercentage,
            approvedCount,
            progressRows: cohortProgressRows
          }
        }
      })
    )

    // Calculate total progress for selected cohort (deliverables + engagement)
    const selectedCohortProgress = cohortProgress.find(cp => cp.cohortId === selectedCohortId)
    const selectedDeliverablePercentage = selectedCohortProgress?.deliverables.percentage ?? 0
    const totalProgress = selectedDeliverablePercentage + globalEngagementPercentage

    // Build the full ProgressAPIResponse (Requirement 5.4)
    const response: ProgressAPIResponse = {
      globalEngagement: {
        percentage: globalEngagementPercentage,
        approvedCount: approvedEngagements.length,
        pendingCount: pendingEngagements.length,
        items: engagementItems
      },
      cohortProgress,
      selectedCohortId,
      totalProgress
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching workshop progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
