'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { CreateCohortParams, UpdateCohortParams } from '@/types/workshops'
import { revalidatePath } from 'next/cache'

/**
 * Creates a new cohort with admin attribution
 * @param data - Cohort creation parameters
 * @returns Created cohort record
 * @throws Error if not authenticated, not admin, or database operation fails
 */
export async function createCohort(data: CreateCohortParams) {
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
    
    if (profileError) {
      throw new Error('Profile not found')
    }
    
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    // Create cohort with audit fields
    const { data: cohort, error: cohortError } = await supabase
      .from('cohorts')
      .insert({
        name: data.name,
        description: data.description,
        start_date: data.start_date,
        registration_opens_at: data.registration_opens_at,
        registration_closes_at: data.registration_closes_at,
        capacity: data.capacity,
        status: data.status || 'draft',
        created_by: profile.id,
        updated_by: profile.id,
      })
      .select()
      .single()

    if (cohortError) {
      console.error('Create cohort error:', cohortError)
      
      // Handle RLS policy violations
      if (cohortError.code === '42501') {
        throw new Error('Permission denied: insufficient privileges to create cohorts')
      }
      
      throw new Error(`Failed to create cohort: ${cohortError.message}`)
    }

    // Revalidate relevant pages
    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return cohort
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while creating cohort')
  }
}

/**
 * Updates an existing cohort with admin attribution
 * @param cohortId - UUID of cohort to update
 * @param data - Cohort update parameters
 * @returns Updated cohort record
 * @throws Error if not authenticated, not admin, or database operation fails
 */
export async function updateCohort(cohortId: string, data: Partial<CreateCohortParams>) {
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
    
    if (profileError) {
      throw new Error('Profile not found')
    }
    
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    // Update cohort with updated_by tracking
    const updatePayload: any = {
      ...data,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    }

    const { data: cohort, error: cohortError } = await supabase
      .from('cohorts')
      .update(updatePayload)
      .eq('id', cohortId)
      .select()
      .single()

    if (cohortError) {
      console.error('Update cohort error:', cohortError)
      
      // Handle RLS policy violations
      if (cohortError.code === '42501') {
        throw new Error('Permission denied: insufficient privileges to update cohorts')
      }
      
      // Handle not found
      if (cohortError.code === 'PGRST116') {
        throw new Error('Cohort not found')
      }
      
      throw new Error(`Failed to update cohort: ${cohortError.message}`)
    }

    // Revalidate relevant pages
    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')
    revalidatePath(`/admin/pilot-workshops/${cohortId}`)

    return cohort
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while updating cohort')
  }
}

/**
 * Gets all cohorts for admin view (all statuses)
 * @returns Array of cohorts with registration counts
 * @throws Error if not authenticated or not admin
 */
export async function getCohorts() {
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
    
    if (profileError) {
      throw new Error('Profile not found')
    }
    
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    // Get all cohorts with registration count
    let query = supabase
      .from('cohorts')
      .select(`
        *,
        creator:profiles!cohorts_created_by_fkey(id, first_name, last_name, full_name),
        updater:profiles!cohorts_updated_by_fkey(id, first_name, last_name, full_name)
      `)
      .order('start_date', { ascending: false })

    // Removed restriction so all admins can view all cohorts

    const { data: cohorts, error: cohortsError } = await query

    if (cohortsError) {
      console.error('Get cohorts error:', cohortsError)
      
      // Handle RLS policy violations
      if (cohortsError.code === '42501') {
        throw new Error('Permission denied: insufficient privileges to view cohorts')
      }
      
      throw new Error(`Failed to fetch cohorts: ${cohortsError.message}`)
    }

    // Get registration counts for each cohort
    const cohortIds = cohorts?.map(c => c.id) || []
    
    if (cohortIds.length === 0) {
      return []
    }

    const { data: registrationCounts, error: countError } = await supabase
      .from('workshop_registrations')
      .select('cohort_id, status')
      .in('cohort_id', cohortIds)

    if (countError) {
      console.error('Get registration counts error:', countError)
    }

    // Aggregate counts by cohort
    const countsByCohort = (registrationCounts || []).reduce((acc, reg) => {
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

    // Enrich cohorts with counts
    return cohorts.map(cohort => ({
      ...cohort,
      registered_count: countsByCohort[cohort.id]?.registered || 0,
      waitlisted_count: countsByCohort[cohort.id]?.waitlisted || 0,
    }))
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching cohorts')
  }
}

/**
 * Gets a single cohort by ID with registration count
 * @param cohortId - UUID of cohort to fetch
 * @returns Cohort with registration count
 * @throws Error if not authenticated, not admin, or cohort not found
 */
export async function getCohortById(cohortId: string) {
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
    
    if (profileError) {
      throw new Error('Profile not found')
    }
    
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    // Get cohort with creator/updater info
    const { data: cohort, error: cohortError } = await supabase
      .from('cohorts')
      .select(`
        *,
        creator:profiles!cohorts_created_by_fkey(id, first_name, last_name, full_name),
        updater:profiles!cohorts_updated_by_fkey(id, first_name, last_name, full_name)
      `)
      .eq('id', cohortId)
      .single()

    if (cohortError) {
      console.error('Get cohort error:', cohortError)
      
      // Handle RLS policy violations
      if (cohortError.code === '42501') {
        throw new Error('Permission denied: insufficient privileges to view this cohort')
      }
      
      // Handle not found
      if (cohortError.code === 'PGRST116') {
        throw new Error('Cohort not found')
      }
      
      throw new Error(`Failed to fetch cohort: ${cohortError.message}`)
    }

    // Get registration counts
    const { data: registrations, error: regError } = await supabase
      .from('workshop_registrations')
      .select('status')
      .eq('cohort_id', cohortId)

    if (regError) {
      console.error('Get registrations error:', regError)
    }

    const registered_count = registrations?.filter(r => r.status === 'registered').length || 0
    const waitlisted_count = registrations?.filter(r => r.status === 'waitlisted').length || 0

    return {
      ...cohort,
      registered_count,
      waitlisted_count,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching cohort')
  }
}

/**
 * Updates a cohort's status
 * @param cohortId - UUID of cohort to update
 * @param status - New status value
 * @returns Updated cohort record
 * @throws Error if not authenticated, not admin, or invalid status
 */
export async function updateCohortStatus(
  cohortId: string,
  status: 'draft' | 'open' | 'closed' | 'completed'
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Authentication required')
    }

    // Validate status
    const validStatuses = ['draft', 'open', 'closed', 'completed']
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }

    const supabase = createServerSupabaseClient()
    
    // Get user profile and verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .single()
    
    if (profileError) {
      throw new Error('Profile not found')
    }
    
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    // Update status with updated_by tracking
    const { data: cohort, error: cohortError } = await supabase
      .from('cohorts')
      .update({
        status,
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cohortId)
      .select()
      .single()

    if (cohortError) {
      console.error('Update cohort status error:', cohortError)
      
      // Handle RLS policy violations
      if (cohortError.code === '42501') {
        throw new Error('Permission denied: insufficient privileges to update cohort status')
      }
      
      // Handle not found
      if (cohortError.code === 'PGRST116') {
        throw new Error('Cohort not found')
      }
      
      throw new Error(`Failed to update cohort status: ${cohortError.message}`)
    }

    // Revalidate relevant pages
    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')
    revalidatePath(`/admin/pilot-workshops/${cohortId}`)

    return cohort
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while updating cohort status')
  }
}
export async function uploadCohortThumbnail(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')

    const { userId } = await auth()
    if (!userId) throw new Error('Authentication required')

    const supabase = createServerSupabaseClient()

    // Get user profile and verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      throw new Error('Admin access required')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = "cohorts/" + Date.now() + "-" + Math.random().toString(36).substring(7) + "." + fileExt
    const filePath = "cohorts/" + fileName

    const { error: uploadError } = await supabase
      .storage
      .from('content-uploads')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw new Error("Failed to upload file: " + uploadError.message)

    const { data: urlData } = supabase
      .storage
      .from('content-uploads')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error('Thumbnail upload error:', error)
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while uploading thumbnail')
  }
}

/**
 * Deletes a cohort and all related data (cascade)
 * @param cohortId - UUID of cohort to delete
 * @returns { success: true }
 * @throws Error if not authenticated, not super_admin, or database operation fails
 */
export async function deleteCohort(cohortId: string) {
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
    if (profile.role !== 'super_admin') throw new Error('Super admin access required to delete cohorts')

    // Get all workshop days for this cohort
    const { data: days } = await supabase
      .from('workshop_days')
      .select('id')
      .eq('cohort_id', cohortId)

    if (days && days.length > 0) {
      const dayIds = days.map(d => d.id)

      // Get all sections
      const { data: sections } = await supabase
        .from('workshop_day_sections')
        .select('id')
        .in('workshop_day_id', dayIds)

      if (sections && sections.length > 0) {
        const sectionIds = sections.map(s => s.id)

        // Get all entries
        const { data: entries } = await supabase
          .from('workshop_day_entries')
          .select('id')
          .in('section_id', sectionIds)

        if (entries && entries.length > 0) {
          const entryIds = entries.map(e => e.id)

          // Delete entry media
          await supabase.from('workshop_entry_media').delete().in('entry_id', entryIds)
        }

        // Delete entries
        await supabase.from('workshop_day_entries').delete().in('section_id', sectionIds)
      }

      // Delete sections
      await supabase.from('workshop_day_sections').delete().in('workshop_day_id', dayIds)

      // Delete day media
      await supabase.from('workshop_day_media').delete().in('workshop_day_id', dayIds)

      // Delete progress principles junction
      const { data: progressRows } = await supabase
        .from('workshop_progress')
        .select('id')
        .in('workshop_day_id', dayIds)

      if (progressRows && progressRows.length > 0) {
        const progressIds = progressRows.map(p => p.id)
        await supabase.from('workshop_progress_principles').delete().in('progress_id', progressIds)
      }

      // Delete progress
      await supabase.from('workshop_progress').delete().in('workshop_day_id', dayIds)

      // Delete deliverable submissions
      await supabase.from('workshop_deliverable_submissions').delete().in('workshop_day_id', dayIds)

      // Delete workshop days
      await supabase.from('workshop_days').delete().eq('cohort_id', cohortId)
    }

    // Delete cohort-level data
    await supabase.from('workshop_principles').delete().eq('cohort_id', cohortId)
    await supabase.from('workshop_engagement').delete().eq('cohort_id', cohortId)
    await supabase.from('workshop_showcase').delete().eq('cohort_id', cohortId)
    await supabase.from('workshop_characters').delete().eq('cohort_id', cohortId)
    await supabase.from('workshop_registrations').delete().eq('cohort_id', cohortId)

    // Delete the cohort itself
    const { error: deleteError } = await supabase
      .from('cohorts')
      .delete()
      .eq('id', cohortId)

    if (deleteError) {
      console.error('Delete cohort error:', deleteError)
      throw new Error(`Failed to delete cohort: ${deleteError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while deleting cohort')
  }
}
