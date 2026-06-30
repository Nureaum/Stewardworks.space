'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { CohortWithUserRegistration } from '@/types/workshops'

/**
 * Gets all public cohorts (status='open') with registration info
 * Includes user's registration status if authenticated
 * @returns Array of cohorts visible to public with registration counts
 */
export async function getPublicCohorts(): Promise<CohortWithUserRegistration[]> {
  try {
    const { userId } = await auth()
    const supabase = createServerSupabaseClient()

    // Get open cohorts
    const { data: cohorts, error: cohortsError } = await supabase
      .from('cohorts')
      .select('*')
      .eq('status', 'open')
      .order('start_date', { ascending: true })

    if (cohortsError) {
      console.error('Get public cohorts error:', cohortsError)
      throw new Error(`Failed to fetch cohorts: ${cohortsError.message}`)
    }

    if (!cohorts || cohorts.length === 0) {
      return []
    }

    const cohortIds = cohorts.map(c => c.id)

    // Get registration counts for each cohort
    const { data: registrations, error: regError } = await supabase
      .from('workshop_registrations')
      .select('cohort_id, status')
      .in('cohort_id', cohortIds)

    if (regError) {
      console.error('Get registrations error:', regError)
    }

    // Aggregate counts by cohort and status
    const countsByCohort = (registrations || []).reduce((acc, reg) => {
      if (!acc[reg.cohort_id]) {
        acc[reg.cohort_id] = { registered: 0, waitlisted: 0 }
      }
      if (reg.status === 'registered') {
        acc[reg.cohort_id].registered++
      } else if (reg.status === 'waitlisted') {
        acc[reg.cohort_id].waitlisted++
      }
      return acc
    }, {} as Record<string, { registered: number; waitlisted: number }>)

    // Get user's registrations if authenticated
    let userRegistrations: Record<string, { status: 'registered' | 'waitlisted' | 'cancelled' }> = {}
    
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()

      if (profile) {
        const { data: userRegs } = await supabase
          .from('workshop_registrations')
          .select('cohort_id, status')
          .eq('profile_id', profile.id)
          .in('cohort_id', cohortIds)

        if (userRegs) {
          userRegistrations = userRegs.reduce((acc, reg) => {
            acc[reg.cohort_id] = { status: reg.status as 'registered' | 'waitlisted' | 'cancelled' }
            return acc
          }, {} as Record<string, { status: 'registered' | 'waitlisted' | 'cancelled' }>)
        }
      }
    }

    // Enrich cohorts with counts and user registration status
    return cohorts.map(cohort => {
      const counts = countsByCohort[cohort.id] || { registered: 0, waitlisted: 0 }
      const now = new Date()
      const registrationOpensAt = cohort.registration_opens_at ? new Date(cohort.registration_opens_at) : null
      const registrationClosesAt = cohort.registration_closes_at ? new Date(cohort.registration_closes_at) : null

      // Determine registration eligibility
      let registrationOpen = true
      if (registrationOpensAt && now < registrationOpensAt) {
        registrationOpen = false
      }
      if (registrationClosesAt && now > registrationClosesAt) {
        registrationOpen = false
      }

      return {
        ...cohort,
        registered_count: counts.registered,
        waitlisted_count: counts.waitlisted,
        user_registration: userRegistrations[cohort.id] || null,
        // Add computed helper field for UI
        can_register: registrationOpen && cohort.status === 'open',
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching public cohorts')
  }
}

/**
 * Gets a single cohort by ID for public viewing
 * Only returns cohort if status is 'open'
 * @param cohortId - UUID of cohort
 * @returns Cohort with registration info or null if not found/not public
 */
export async function getPublicCohort(cohortId: string): Promise<CohortWithUserRegistration | null> {
  try {
    const { userId } = await auth()
    const supabase = createServerSupabaseClient()

    // Get cohort if it's open
    const { data: cohort, error: cohortError } = await supabase
      .from('cohorts')
      .select('*')
      .eq('id', cohortId)
      .eq('status', 'open')
      .single()

    if (cohortError) {
      if (cohortError.code === 'PGRST116') {
        return null // Not found or not open
      }
      throw new Error(`Failed to fetch cohort: ${cohortError.message}`)
    }

    // Get registration counts
    const { data: registrations } = await supabase
      .from('workshop_registrations')
      .select('status')
      .eq('cohort_id', cohortId)

    const registered_count = registrations?.filter(r => r.status === 'registered').length || 0
    const waitlisted_count = registrations?.filter(r => r.status === 'waitlisted').length || 0

    // Get user's registration if authenticated
    let user_registration = null
    
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', userId)
        .single()

      if (profile) {
        const { data: userReg } = await supabase
          .from('workshop_registrations')
          .select('status')
          .eq('profile_id', profile.id)
          .eq('cohort_id', cohortId)
          .single()

        if (userReg) {
          user_registration = { status: userReg.status as 'registered' | 'waitlisted' | 'cancelled' }
        }
      }
    }

    const now = new Date()
    const registrationOpensAt = cohort.registration_opens_at ? new Date(cohort.registration_opens_at) : null
    const registrationClosesAt = cohort.registration_closes_at ? new Date(cohort.registration_closes_at) : null

    let registrationOpen = true
    if (registrationOpensAt && now < registrationOpensAt) {
      registrationOpen = false
    }
    if (registrationClosesAt && now > registrationClosesAt) {
      registrationOpen = false
    }

    return {
      ...cohort,
      registered_count,
      waitlisted_count,
      user_registration,
      can_register: registrationOpen && cohort.status === 'open',
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching cohort')
  }
}
