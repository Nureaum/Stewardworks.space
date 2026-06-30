'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { ReviewDeliverableResult, SubmissionWithMetadata, UpdateRegistrationStatusParams } from '@/types/workshops'
import { revalidatePath } from 'next/cache'

/**
 * Gets deliverable submissions for admin review
 * Can filter by cohort and/or status
 * @param cohortId - Optional cohort UUID to filter by
 * @param status - Optional deliverable status to filter by
 * @returns Array of submissions with participant and day metadata
 * @throws Error if not authenticated or not admin
 */
export async function getSubmissionsForReview(
  cohortId?: string,
  status?: 'submitted' | 'approved' | 'rejected'
): Promise<SubmissionWithMetadata[]> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Authentication required')
    }

    const supabase = createServerSupabaseClient()
    
    // Get user profile and verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()
    
    if (profileError || !profile) {
      throw new Error('Profile not found')
    }
    
    if (!['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    // Build query for progress rows with submissions
    let query = supabase
      .from('workshop_progress')
      .select(`
        id,
        workshop_day_id,
        profile_id,
        deliverable_status,
        deliverable_submitted_at,
        reviewed_by,
        reviewed_at,
        review_note,
        workshop_days!inner(
          id,
          title,
          day_number,
          cohort_id,
          cohorts!inner(name)
        ),
        profiles!workshop_progress_profile_id_fkey(
          id,
          full_name,
          email
        )
      `)

    // Filter by status if provided
    if (status) {
      query = query.eq('deliverable_status', status)
    } else {
      // Default to showing submitted and rejected (not approved or not_submitted)
      query = query.in('deliverable_status', ['submitted', 'rejected'])
    }

    // Filter by cohort if provided
    if (cohortId) {
      query = query.eq('workshop_days.cohort_id', cohortId)
    }

    query = query.order('deliverable_submitted_at', { ascending: false })

    const { data: progressRows, error: progressError } = await query

    if (progressError) {
      console.error('Get submissions error:', progressError)
      throw new Error(`Failed to fetch submissions: ${progressError.message}`)
    }

    if (!progressRows || progressRows.length === 0) {
      return []
    }

    // Get latest submissions for each progress row
    const progressIds = progressRows.map(p => p.workshop_day_id + '|' + p.profile_id)
    
    const { data: submissions, error: submissionsError } = await supabase
      .from('workshop_deliverable_submissions')
      .select('*')
      .in('workshop_day_id', progressRows.map(p => p.workshop_day_id))
      .in('profile_id', progressRows.map(p => p.profile_id))
      .order('submitted_at', { ascending: false })

    if (submissionsError) {
      console.error('Get submissions detail error:', submissionsError)
    }

    // Group submissions by day+profile and get latest
    const latestSubmissions = (submissions || []).reduce((acc, sub) => {
      const key = `${sub.workshop_day_id}|${sub.profile_id}`
      if (!acc[key]) {
        acc[key] = sub
      }
      return acc
    }, {} as Record<string, any>)

    // Combine progress data with submissions
    return progressRows.map(progress => {
      const key = `${progress.workshop_day_id}|${progress.profile_id}`
      const submission = latestSubmissions[key]
      const day = progress.workshop_days as any
      const participant = progress.profiles as any

      return {
        id: submission?.id || '',
        workshop_day_id: progress.workshop_day_id,
        profile_id: progress.profile_id,
        submission_text: submission?.submission_text || null,
        file_storage_path: submission?.file_storage_path || null,
        external_video_url: submission?.external_video_url || null,
        submitted_at: submission?.submitted_at || progress.deliverable_submitted_at || '',
        day_title: day?.title || '',
        day_number: day?.day_number || 1,
        participant_name: participant?.full_name || participant?.email || 'Unknown',
        participant_email: participant?.email || '',
        deliverable_status: progress.deliverable_status,
        review_note: progress.review_note,
        progress_id: progress.id,
      }
    })
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching submissions')
  }
}

/**
 * Reviews a deliverable submission (approve or reject)
 * Updates progress record and may unlock next day
 * @param progressId - UUID of workshop_progress record
 * @param status - Review decision ('approved' or 'rejected')
 * @param reviewNote - Optional feedback note (required for rejection)
 * @returns Result indicating success and if next day unlocked
 * @throws Error if not authenticated or not admin
 */
export async function reviewDeliverable(
  progressId: string,
  status: 'approved' | 'rejected',
  reviewNote?: string
): Promise<ReviewDeliverableResult> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Authentication required')
    }

    const supabase = createServerSupabaseClient()
    
    // Get user profile and verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()
    
    if (profileError || !profile) {
      throw new Error('Profile not found')
    }
    
    if (!['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    // Get progress record to find day and participant
    const { data: progress, error: getError } = await supabase
      .from('workshop_progress')
      .select(`
        *,
        workshop_days!inner(
          id,
          cohort_id,
          day_number
        )
      `)
      .eq('id', progressId)
      .single()

    if (getError || !progress) {
      throw new Error('Progress record not found')
    }

    // Update progress record
    const { error: updateError } = await supabase
      .from('workshop_progress')
      .update({
        deliverable_status: status,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        review_note: reviewNote || null,
      })
      .eq('id', progressId)

    if (updateError) {
      console.error('Review update error:', updateError)
      
      // Handle RLS policy violations
      if (updateError.code === '42501') {
        throw new Error('Permission denied: insufficient privileges to review deliverables')
      }
      
      throw new Error(`Failed to update review: ${updateError.message}`)
    }

    // Check if we should unlock next day
    let nextDayUnlocked = false
    const day = progress.workshop_days as any

    if (status === 'approved' && day.day_number < 3) {
      // Find next day
      const { data: nextDay } = await supabase
        .from('workshop_days')
        .select('id')
        .eq('cohort_id', day.cohort_id)
        .eq('day_number', day.day_number + 1)
        .single()

      if (nextDay) {
        // Check if progress row exists for next day
        const { data: nextProgress } = await supabase
          .from('workshop_progress')
          .select('id, unlocked_at')
          .eq('workshop_day_id', nextDay.id)
          .eq('profile_id', progress.profile_id)
          .single()

        // Create or update progress row to unlock next day
        if (!nextProgress) {
          const { error: insertError } = await supabase
            .from('workshop_progress')
            .insert({
              workshop_day_id: nextDay.id,
              profile_id: progress.profile_id,
              unlocked_at: new Date().toISOString(),
              deliverable_status: 'not_submitted',
            })

          if (!insertError) {
            nextDayUnlocked = true
          }
        } else if (!nextProgress.unlocked_at) {
          const { error: unlockError } = await supabase
            .from('workshop_progress')
            .update({
              unlocked_at: new Date().toISOString(),
            })
            .eq('id', nextProgress.id)

          if (!unlockError) {
            nextDayUnlocked = true
          }
        }
      }
    }

    // Revalidate relevant pages
    revalidatePath(`/hub/pilot-workshops/${day.cohort_id}`)
    revalidatePath(`/admin/pilot-workshops/${day.cohort_id}/reviews`)

    return {
      success: true,
      message: status === 'approved' ? 'Deliverable approved' : 'Deliverable rejected',
      nextDayUnlocked,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while reviewing deliverable')
  }
}

/**
 * Gets all registrations for a cohort with participant details
 * @param cohortId - UUID of cohort
 * @returns Array of registrations with participant info
 * @throws Error if not authenticated or not admin
 */
export async function getRegistrations(cohortId: string) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Authentication required')
    }

    const supabase = createServerSupabaseClient()
    
    // Get user profile and verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()
    
    if (profileError || !profile) {
      throw new Error('Profile not found')
    }
    
    if (!['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    // Get registrations with participant details
    const { data: registrations, error: regError } = await supabase
      .from('workshop_registrations')
      .select(`
        *,
        profiles!workshop_registrations_profile_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('cohort_id', cohortId)
      .order('registered_at', { ascending: false })

    if (regError) {
      console.error('Get registrations error:', regError)
      throw new Error(`Failed to fetch registrations: ${regError.message}`)
    }

    return (registrations || []).map(reg => ({
      ...reg,
      participant_name: (reg.profiles as any)?.full_name || (reg.profiles as any)?.email || 'Unknown',
      participant_email: (reg.profiles as any)?.email || '',
    }))
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching registrations')
  }
}

/**
 * Updates a registration status (e.g., waitlisted → registered)
 * Triggers Day 1 unlock if cohort already started
 * @param params - Registration ID and new status
 * @returns Updated registration
 * @throws Error if not authenticated or not admin
 */
export async function updateRegistrationStatus(params: UpdateRegistrationStatusParams) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Authentication required')
    }

    const supabase = createServerSupabaseClient()
    
    // Get user profile and verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()
    
    if (profileError || !profile) {
      throw new Error('Profile not found')
    }
    
    if (!['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    // Validate status transition
    const validStatuses = ['registered', 'waitlisted', 'cancelled']
    if (!validStatuses.includes(params.newStatus)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }

    // Get registration and cohort info
    const { data: registration, error: getError } = await supabase
      .from('workshop_registrations')
      .select(`
        *,
        cohorts!inner(id, start_date)
      `)
      .eq('id', params.registrationId)
      .single()

    if (getError || !registration) {
      throw new Error('Registration not found')
    }

    // Update registration status
    const { data: updated, error: updateError } = await supabase
      .from('workshop_registrations')
      .update({ status: params.newStatus })
      .eq('id', params.registrationId)
      .select()
      .single()

    if (updateError) {
      console.error('Update registration status error:', updateError)
      throw new Error(`Failed to update registration status: ${updateError.message}`)
    }

    // If changing to registered and cohort started, unlock Day 1
    if (params.newStatus === 'registered') {
      const cohort = registration.cohorts as any
      const cohortStarted = new Date(cohort.start_date) <= new Date()

      if (cohortStarted) {
        // Find Day 1
        const { data: day1 } = await supabase
          .from('workshop_days')
          .select('id')
          .eq('cohort_id', cohort.id)
          .eq('day_number', 1)
          .single()

        if (day1) {
          // Create or update progress row for Day 1
          const { data: existingProgress } = await supabase
            .from('workshop_progress')
            .select('id')
            .eq('workshop_day_id', day1.id)
            .eq('profile_id', registration.profile_id)
            .single()

          if (!existingProgress) {
            await supabase
              .from('workshop_progress')
              .insert({
                workshop_day_id: day1.id,
                profile_id: registration.profile_id,
                unlocked_at: new Date().toISOString(),
                deliverable_status: 'not_submitted',
              })
          }
        }
      }
    }

    // Revalidate relevant pages
    revalidatePath(`/admin/pilot-workshops/${registration.cohort_id}/registrations`)

    return updated
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while updating registration status')
  }
}
