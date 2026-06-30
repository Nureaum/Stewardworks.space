'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { RegisterForCohortResult, DayWithProgress, SubmissionData, SubmitDeliverableResult } from '@/types/workshops'
import { revalidatePath } from 'next/cache'

/**
 * Registers the authenticated user for a cohort
 * Handles capacity checking and waitlist logic
 * @param cohortId - UUID of cohort to register for
 * @returns Registration result with status and cohort info
 * @throws Error with specific messages per R17
 */
export async function registerForCohort(cohortId: string): Promise<RegisterForCohortResult> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Authentication required')
    }

    const supabase = createServerSupabaseClient()
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()
    
    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    // Get cohort and validate
    const { data: cohort, error: cohortError } = await supabase
      .from('cohorts')
      .select('*')
      .eq('id', cohortId)
      .single()

    if (cohortError || !cohort) {
      throw new Error('Cohort not found')
    }

    // Validate cohort status
    if (cohort.status !== 'open') {
      throw new Error('Registration is not currently open for this cohort')
    }

    // Check registration window
    const now = new Date()
    
    if (cohort.registration_opens_at) {
      const opensAt = new Date(cohort.registration_opens_at)
      if (now < opensAt) {
        throw new Error(`Registration opens on ${opensAt.toLocaleDateString()}`)
      }
    }
    
    if (cohort.registration_closes_at) {
      const closesAt = new Date(cohort.registration_closes_at)
      if (now > closesAt) {
        throw new Error('Registration has closed for this cohort')
      }
    }

    // Check for duplicate registration
    const { data: existing } = await supabase
      .from('workshop_registrations')
      .select('id')
      .eq('cohort_id', cohortId)
      .eq('profile_id', profile.id)
      .single()

    if (existing) {
      throw new Error('You are already registered for this cohort')
    }

    // Check capacity and determine status
    const { data: registrations } = await supabase
      .from('workshop_registrations')
      .select('status')
      .eq('cohort_id', cohortId)

    const registeredCount = registrations?.filter(r => r.status === 'registered').length || 0
    
    const registrationStatus: 'registered' | 'waitlisted' = 
      cohort.capacity && registeredCount >= cohort.capacity ? 'waitlisted' : 'registered'

    // Insert registration
    const { error: insertError } = await supabase
      .from('workshop_registrations')
      .insert({
        cohort_id: cohortId,
        profile_id: profile.id,
        status: registrationStatus,
      })

    if (insertError) {
      console.error('Registration error:', insertError)
      
      // Handle unique constraint violation (race condition)
      if (insertError.code === '23505') {
        throw new Error('You are already registered for this cohort')
      }
      
      throw new Error(`Failed to register: ${insertError.message}`)
    }

    // Revalidate relevant pages
    revalidatePath('/hub/pilot-workshops')
    revalidatePath(`/hub/pilot-workshops/${cohortId}`)

    return {
      status: registrationStatus,
      cohortName: cohort.name,
      startDate: cohort.start_date,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred during registration')
  }
}

/**
 * Helper function to check if a day is unlocked for a user
 * Implements sequential unlock logic based on previous day completion
 * @param dayId - UUID of workshop day to check
 * @param profileId - UUID of user profile
 * @param supabase - Supabase client instance
 * @returns true if day is unlocked, false otherwise
 */
async function isDayUnlockedForUser(
  dayId: string,
  profileId: string,
  supabase: any
): Promise<boolean> {
  // Get the day info
  const { data: day } = await supabase
    .from('workshop_days')
    .select('day_number, cohort_id, requires_admin_approval')
    .eq('id', dayId)
    .single()

  if (!day) return false

  // Day 1 unlock is handled separately in getWorkshopDashboard
  if (day.day_number === 1) {
    return true // Assuming caller already checked start_date
  }

  // Get previous day
  const { data: previousDay } = await supabase
    .from('workshop_days')
    .select('id')
    .eq('cohort_id', day.cohort_id)
    .eq('day_number', day.day_number - 1)
    .single()

  if (!previousDay) return false

  // Check previous day's progress
  const { data: previousProgress } = await supabase
    .from('workshop_progress')
    .select('deliverable_status')
    .eq('workshop_day_id', previousDay.id)
    .eq('profile_id', profileId)
    .single()

  if (!previousProgress) return false

  // Always unlock if previous day is submitted or approved (no admin approval required)
  return previousProgress.deliverable_status === 'submitted' || 
         previousProgress.deliverable_status === 'approved'
}

/**
 * Gets all cohorts the authenticated user is registered for
 * Used for multi-cohort selector in dashboard
 * @returns Array of cohorts with registration status
 */
export async function getUserRegisteredCohorts() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return []
    }

    const supabase = createServerSupabaseClient()
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()
    
    if (profileError || !profile) {
      return []
    }

    // Get all registrations with cohort info
    const { data: registrations, error: regError } = await supabase
      .from('workshop_registrations')
      .select(`
        cohort_id,
        status,
        cohorts (
          id,
          name,
          start_date,
          status
        )
      `)
      .eq('profile_id', profile.id)
      .eq('status', 'registered')
      .order('cohorts(start_date)', { ascending: true })

    if (regError || !registrations) {
      return []
    }

    return registrations
      .filter((reg: any) => reg.cohorts && reg.cohorts.status === 'open')
      .map((reg: any) => ({
        id: reg.cohorts.id,
        name: reg.cohorts.name,
        start_date: reg.cohorts.start_date,
        registration_status: reg.status,
      }))
  } catch (error) {
    console.error('Error fetching user registered cohorts:', error)
    return []
  }
}

/**
 * Gets workshop dashboard for a participant
 * Includes all days with unlock states, progress, and media
 * Lazily creates Day 1 progress row when unlocked
 * @param cohortId - UUID of cohort
 * @returns Array of days with progress and unlock status
 * @throws Error if not registered or access denied
 */
export async function getWorkshopDashboard(cohortId: string): Promise<DayWithProgress[]> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Authentication required')
    }

    const supabase = createServerSupabaseClient()
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()
    
    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    // Check registration
    const { data: registration, error: regError } = await supabase
      .from('workshop_registrations')
      .select('status')
      .eq('cohort_id', cohortId)
      .eq('profile_id', profile.id)
      .single()

    if (regError || !registration) {
      throw new Error('Not registered for this cohort')
    }

    if (registration.status !== 'registered') {
      throw new Error('Cohort access requires registered status. You are currently waitlisted.')
    }

    // Get cohort to check start_date
    const { data: cohort } = await supabase
      .from('cohorts')
      .select('start_date')
      .eq('id', cohortId)
      .single()

    if (!cohort) {
      throw new Error('Cohort not found')
    }

    const cohortStarted = new Date(cohort.start_date) <= new Date()

    // Get all days with progress and media (left join for progress)
    const { data: days, error: daysError } = await supabase
      .from('workshop_days')
      .select(`
        *,
        workshop_day_media(*)
      `)
      .eq('cohort_id', cohortId)
      .order('day_number', { ascending: true })

    if (daysError) {
      throw new Error(`Failed to fetch workshop days: ${daysError.message}`)
    }

    // Get all progress rows for this user in this cohort
    const dayIds = days?.map(d => d.id) || []
    const { data: progressRows } = await supabase
      .from('workshop_progress')
      .select('*')
      .in('workshop_day_id', dayIds)
      .eq('profile_id', profile.id)

    const progressByDay = (progressRows || []).reduce((acc, p) => {
      acc[p.workshop_day_id] = p
      return acc
    }, {} as Record<string, any>)

    // Process each day to determine unlock state
    const processedDays: DayWithProgress[] = await Promise.all(
      (days || []).map(async (day) => {
        let unlocked = false
        let unlockMessage: string | null = null
        let progress = progressByDay[day.id] || null

        if (day.day_number === 1) {
          // Day 1 unlocks immediately, regardless of cohort start date
          unlocked = true
          // Lazily create progress row if missing
          if (!progress) {
            const { data: newProgress } = await supabase
              .from('workshop_progress')
              .insert({
                workshop_day_id: day.id,
                profile_id: profile.id,
                unlocked_at: new Date().toISOString(),
                deliverable_status: 'not_submitted',
              })
              .select()
              .single()
            
            if (newProgress) {
              progress = newProgress
              progressByDay[day.id] = newProgress
            }
          }
        } else {
          // Days 2+ unlock based on previous day completion
          unlocked = await isDayUnlockedForUser(day.id, profile.id, supabase)
          
          if (!unlocked) {
            unlockMessage = `Unlocks after Day ${day.day_number - 1} is submitted`
          } else if (!progress) {
            // Create progress row when day becomes unlocked
            const { data: newProgress } = await supabase
              .from('workshop_progress')
              .insert({
                workshop_day_id: day.id,
                profile_id: profile.id,
                unlocked_at: new Date().toISOString(),
                deliverable_status: 'not_submitted',
              })
              .select()
              .single()
            
            if (newProgress) {
              progress = newProgress
            }
          }
        }

        // Sort media by sort_order
        const sortedMedia = (day.workshop_day_media || []).sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        )

        return {
          ...day,
          unlocked,
          progress,
          unlock_message: unlockMessage,
          media: sortedMedia,
        }
      })
    )

    return processedDays
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching workshop dashboard')
  }
}

/**
 * Submits a deliverable for a workshop day
 * Supports text, file, and video URL submissions
 * Handles resubmissions by creating new submission records
 * @param dayId - UUID of workshop day
 * @param submissionData - Submission content
 * @returns Submission result with ID and message
 * @throws Error if day not unlocked or submission fails
 */
export async function submitDeliverable(
  dayId: string,
  submissionData: SubmissionData
): Promise<SubmitDeliverableResult> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Authentication required')
    }

    const supabase = createServerSupabaseClient()
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()
    
    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    // Verify day is unlocked
    const { data: progress, error: progressError } = await supabase
      .from('workshop_progress')
      .select('unlocked_at, deliverable_status')
      .eq('workshop_day_id', dayId)
      .eq('profile_id', profile.id)
      .single()

    if (progressError || !progress || !progress.unlocked_at) {
      throw new Error('This day is not yet unlocked')
    }

    // Handle file upload if present
    let file_storage_path: string | null = null
    if (submissionData.file) {
      const file = submissionData.file
      const fileExt = file.name.split('.').pop()
      const fileName = `${dayId}/${profile.id}/${Date.now()}.${fileExt}`
      const filePath = `deliverables/${fileName}`

      const { error: uploadError } = await supabase
        .storage
        .from('workshop-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      file_storage_path = filePath
    }

    // Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from('workshop_deliverable_submissions')
      .insert({
        workshop_day_id: dayId,
        profile_id: profile.id,
        submission_text: submissionData.submission_text || null,
        file_storage_path: file_storage_path,
        external_video_url: submissionData.external_video_url || null,
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Submission error:', submissionError)
      
      // Clean up uploaded file if submission fails
      if (file_storage_path) {
        await supabase.storage.from('workshop-media').remove([file_storage_path])
      }
      
      throw new Error(`Failed to submit deliverable: ${submissionError.message}`)
    }

    // Update progress row
    const { error: updateError } = await supabase
      .from('workshop_progress')
      .update({
        deliverable_submitted_at: new Date().toISOString(),
        deliverable_status: 'submitted',
      })
      .eq('workshop_day_id', dayId)
      .eq('profile_id', profile.id)

    if (updateError) {
      console.error('Progress update error:', updateError)
      // Submission is saved, but progress update failed - log but don't fail
    }

    // Get cohort_id for revalidation
    const { data: day } = await supabase
      .from('workshop_days')
      .select('cohort_id')
      .eq('id', dayId)
      .single()

    if (day) {
      revalidatePath(`/hub/pilot-workshops/${day.cohort_id}`)
      revalidatePath(`/hub/pilot-workshops/${day.cohort_id}/day/${dayId}`)
    }

    return {
      success: true,
      submissionId: submission.id,
      message: 'Deliverable submitted successfully',
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while submitting deliverable')
  }
}

/**
 * Automatically approves a day's progress when all topics are completed.
 */
export async function markDayProgressApproved(dayId: string, cohortId: string) {
  console.log('[markDayProgressApproved] Called with dayId:', dayId, 'cohortId:', cohortId)
  try {
    const { userId } = await auth()
    if (!userId) {
      console.log('[markDayProgressApproved] Error: No userId from auth()')
      return false
    }
    
    const supabase = createServerSupabaseClient()
    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_user_id', userId).single()
    if (!profile) {
      console.log('[markDayProgressApproved] Error: No profile found for userId:', userId)
      return false
    }
    
    console.log('[markDayProgressApproved] Found profile:', profile.id)
    
    // Use upsert to ensure the row exists and is marked approved
    const { data, error } = await supabase
      .from('workshop_progress')
      .upsert({ 
        workshop_day_id: dayId,
        profile_id: profile.id,
        deliverable_status: 'approved',
        unlocked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'workshop_day_id,profile_id'
      })
      .select()
      
    if (error) {
      console.error('[markDayProgressApproved] Supabase upsert error:', error)
      return false
    }
    
    console.log('[markDayProgressApproved] Upsert successful:', data)
      
    revalidatePath(`/hub/pilot-workshops/${cohortId}`, 'layout')
    console.log('[markDayProgressApproved] revalidatePath called')
    return true
  } catch (e) {
    console.error('[markDayProgressApproved] Exception caught:', e)
    return false
  }
}

