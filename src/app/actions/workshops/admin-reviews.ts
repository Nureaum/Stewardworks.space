'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { ReviewDeliverableResult, SubmissionWithMetadata, UpdateRegistrationStatusParams } from '@/types/workshops'
import { revalidatePath } from 'next/cache'

/**
 * Creates a notification for a user when their engagement or deliverable is reviewed
 */
async function createApprovalNotification(
  profileId: string,
  type: 'engagement' | 'deliverable',
  status: 'approved' | 'rejected',
  itemTitle: string,
  reviewNote?: string
) {
  try {
    const supabase = createServerSupabaseClient()
    
    const emoji = status === 'approved' ? '✅' : '❌'
    const action = status === 'approved' ? 'approved' : 'needs revision'
    const title = `${emoji} ${type === 'engagement' ? 'Engagement' : 'Deliverable'} ${action}`
    const message = reviewNote 
      ? `Your ${type} "${itemTitle}" has been ${action}. Note: ${reviewNote}`
      : `Your ${type} "${itemTitle}" has been ${action}.`
    
    await supabase
      .from('helpdesk_notifications')
      .insert({
        user_id: profileId,
        title,
        message,
        link: '/hub?screen=progress',
        is_read: false,
        type: 'approval'
      })
  } catch (err) {
    // Don't fail the review if notification fails
    console.error('Failed to create approval notification:', err)
  }
}

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
  status?: 'submitted' | 'approved' | 'rejected' | 'all'
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
    if (status === 'all') {
      // History mode: show everything EXCEPT not_submitted (those are just unlocked days with no work)
      query = query.in('deliverable_status', ['submitted', 'approved', 'rejected'])
    } else if (status) {
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

    // Get banked principles for these progress rows
    const progressRowIds = progressRows.map(p => p.id)
    const { data: bankedPrinciples, error: principlesError } = await supabase
      .from('workshop_progress_principles')
      .select('progress_id, principle_id')
      .in('progress_id', progressRowIds)

    if (principlesError) {
      console.error('Get banked principles error:', principlesError)
    }

    // Create a map of progress_id -> principle_id
    const principlesByProgress = (bankedPrinciples || []).reduce((acc, bp) => {
      acc[bp.progress_id] = bp.principle_id
      return acc
    }, {} as Record<string, string>)

    // Group submissions by day+profile and get latest
    const latestSubmissions = (submissions || []).reduce((acc, sub) => {
      const key = `${sub.workshop_day_id}|${sub.profile_id}`
      if (!acc[key]) {
        acc[key] = sub
      }
      return acc
    }, {} as Record<string, any>)

    console.log('[getSubmissionsForReview] Found progress rows:', progressRows.length, 'banked principles:', bankedPrinciples?.length || 0);
    console.log('[getSubmissionsForReview] principlesByProgress:', principlesByProgress);
    // Combine progress data with submissions
    return progressRows.map(progress => {
      const key = `${progress.workshop_day_id}|${progress.profile_id}`
      const submission = latestSubmissions[key]
      const day = progress.workshop_days as any
      const participant = progress.profiles as any
      const principleId = principlesByProgress[progress.id] || null
      
      console.log('[getSubmissionsForReview] Progress:', progress.id, 'principleId:', principleId);

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
        principle_id: principleId,
        title: submission?.title || null,
        description: submission?.description || null,
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
 * Gets pending engagement submissions for admin review
 */
export async function getPendingEngagements(
  cohortId?: string
): Promise<any[]> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Authentication required')

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

    let query = supabase
      .from('workshop_engagement')
      .select(`
        id,
        cohort_id,
        profile_id,
        kind,
        title,
        source,
        url,
        content,
        status,
        created_at,
        profiles!workshop_engagement_profile_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (cohortId) {
      query = query.eq('cohort_id', cohortId)
    }

    const { data: engagements, error } = await query

    if (error) {
      console.error('Get pending engagements error:', error)
      throw new Error(`Failed to fetch pending engagements: ${error.message}`)
    }

    if (!engagements) return []

    return engagements.map((eng: any) => ({
      id: eng.id,
      workshop_day_id: null, // Signals it's an engagement
      profile_id: eng.profile_id,
      title: eng.title,
      kind: eng.kind,
      source: eng.source,
      url: eng.url,
      submission_text: eng.content || eng.url || eng.title, // Map to what admin expects
      submitted_at: eng.created_at,
      participant_name: eng.profiles?.full_name || eng.profiles?.email || 'Unknown',
      participant_email: eng.profiles?.email || '',
      deliverable_status: eng.status,
    }))

  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while fetching pending engagements')
  }
}


/**
 * Gets ALL engagement items for admin history (all statuses)
 */
export async function getAllEngagementsHistory(
  cohortId?: string
): Promise<any[]> {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Authentication required')

    const supabase = createServerSupabaseClient()
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()
    
    if (profileError || !profile) throw new Error('Profile not found')
    if (!['admin', 'super_admin'].includes(profile.role)) throw new Error('Admin access required')

    let query = supabase
      .from('workshop_engagement')
      .select(`
        id,
        cohort_id,
        profile_id,
        kind,
        title,
        source,
        url,
        content,
        status,
        created_at,
        reviewed_at,
        review_note,
        profiles!workshop_engagement_profile_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (cohortId) {
      query = query.eq('cohort_id', cohortId)
    }

    const { data: engagements, error } = await query

    if (error) {
      console.error('Get all engagements history error:', error)
      throw new Error(`Failed to fetch engagements history: ${error.message}`)
    }

    if (!engagements) return []

    return engagements.map((eng: any) => ({
      id: eng.id,
      workshop_day_id: null,
      profile_id: eng.profile_id,
      title: eng.title,
      kind: eng.kind,
      source: eng.source,
      url: eng.url,
      submission_text: eng.content || eng.url || eng.title,
      submitted_at: eng.created_at,
      reviewed_at: eng.reviewed_at,
      review_note: eng.review_note,
      participant_name: eng.profiles?.full_name || eng.profiles?.email || 'Unknown',
      participant_email: eng.profiles?.email || '',
      deliverable_status: eng.status,
    }))

  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while fetching engagements history')
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

    // Notify the student about the review result
    const dayLabel = `Day ${(progress.workshop_days as any)?.day_number || ''}`;
    await createApprovalNotification(
      progress.profile_id,
      'deliverable',
      status,
      `${dayLabel} Deliverable`,
      reviewNote
    )

    // Check if we should unlock next day
    let nextDayUnlocked = false
    let bankedPrinciple: any = undefined
    const day = progress.workshop_days as any

    if (status === 'approved') {
      // Get the banked principle for this progress
      const { data: principle } = await supabase
        .from('workshop_progress_principles')
        .select('*')
        .eq('progress_id', progressId)
        .single()
      
      if (principle) {
        bankedPrinciple = principle
      }

      if (day.day_number < 3) {
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
    }

    // Revalidate relevant pages
    revalidatePath(`/hub/pilot-workshops/${day.cohort_id}`)
    revalidatePath(`/hub/pilot-workshops/${day.cohort_id}/journey`)
    revalidatePath(`/admin/pilot-workshops/${day.cohort_id}/reviews`)

    return {
      success: true,
      message: status === 'approved' ? 'Deliverable approved' : 'Deliverable rejected',
      nextDayUnlocked,
      bankedPrinciple,
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

/**
 * Reviews an engagement item (approve or reject)
 * @param engagementId - UUID of the engagement to review
 * @param status - New status: 'approved' or 'rejected'
 * @returns Updated engagement record
 * @throws Error if not authenticated or not admin
 */
export async function reviewEngagement(engagementId: string, status: 'approved' | 'rejected', note?: string) {
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

    const { data: engagement, error: engError } = await supabase
      .from('workshop_engagement')
      .update({
        status,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        review_note: note || null,
      })
      .eq('id', engagementId)
      .select()
      .single()

    if (engError) {
      console.error('Review engagement error:', engError)
      throw new Error(`Failed to review engagement: ${engError.message}`)
    }

    // If approved and the engagement requested showcase visibility, update content to make it visible
    if (status === 'approved' && engagement.content) {
      try {
        const contentData = JSON.parse(engagement.content)
        if (contentData.showcaseRequested === true && contentData.showcaseVisible !== true) {
          contentData.showcaseVisible = true
          await supabase
            .from('workshop_engagement')
            .update({ content: JSON.stringify(contentData) })
            .eq('id', engagementId)
        }
      } catch (e) {
        // content is not JSON, skip
      }
    }

    // Notify the student about the review result
    await createApprovalNotification(
      engagement.profile_id,
      'engagement',
      status,
      engagement.title || engagement.kind || 'item',
      note
    )

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return engagement
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while reviewing engagement')
  }
}


/**
 * Gets all participants in a cohort with their actual chia progress
 * Returns each participant's approved deliverables count and engagement percentage
 */
export async function getParticipantsProgress(cohortId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Authentication required')

    const supabase = createServerSupabaseClient()
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()
    
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    // Get all registrations for this cohort
    const { data: registrations } = await supabase
      .from('workshop_registrations')
      .select(`
        profile_id,
        profiles!workshop_registrations_profile_id_fkey(id, full_name, email)
      `)
      .eq('cohort_id', cohortId)
      .eq('status', 'registered')

    if (!registrations) return []

    // Get all progress rows for this cohort's days
    const { data: days } = await supabase
      .from('workshop_days')
      .select('id')
      .eq('cohort_id', cohortId)

    const dayIds = (days || []).map(d => d.id)
    if (dayIds.length === 0) return []

    const { data: progressRows } = await supabase
      .from('workshop_progress')
      .select('profile_id, deliverable_status')
      .in('workshop_day_id', dayIds)

    // Get all engagement for participants in this cohort
    const profileIds = registrations.map(r => r.profile_id)
    const { data: engagements } = await supabase
      .from('workshop_engagement')
      .select('profile_id, kind, status')
      .in('profile_id', profileIds)
      .eq('status', 'approved')

    // Build participant progress map
    return registrations.map(reg => {
      const pid = reg.profile_id
      const participant = reg.profiles as any
      const name = participant?.full_name || participant?.email || 'Unknown'
      
      // Count approved deliverables
      const approvedDelivs = (progressRows || []).filter(
        p => p.profile_id === pid && p.deliverable_status === 'approved'
      ).length
      const delivPct = Math.min(approvedDelivs * 25, 75)
      
      // Count approved engagement points
      const engPoints = (engagements || []).filter(e => e.profile_id === pid).reduce((acc, e) => {
        if (e.kind === 'bookmark' || e.kind === 'note') return acc + 1
        if (e.kind === 'generation') return acc + 2
        if (e.kind === 'prompt') return acc + 3
        return acc + 1
      }, 0)
      const engPct = Math.min(engPoints, 25)
      
      return {
        profileId: pid,
        name,
        approvedDelivs,
        delivPct,
        engPct,
        totalPct: delivPct + engPct,
      }
    })
  } catch (error) {
    console.error('getParticipantsProgress error:', error)
    return []
  }
}

/**
 * Get all characters for a cohort (admin only)
 * Returns a map of profileId -> character data
 */
export async function getCohortCharacters(cohortId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Authentication required')

    const supabase = createServerSupabaseClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    const { data: characters } = await supabase
      .from('workshop_characters')
      .select('*')
      .eq('cohort_id', cohortId)

    return characters || []
  } catch (error) {
    console.error('getCohortCharacters error:', error)
    return []
  }
}
