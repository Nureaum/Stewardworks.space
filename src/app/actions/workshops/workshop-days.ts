'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { CreateWorkshopDayParams, UpdateWorkshopDayParams, CreateMediaParams } from '@/types/workshops'
import { revalidatePath } from 'next/cache'

/**
 * Creates a new workshop day for a cohort
 * @param cohortId - UUID of the cohort
 * @param data - Workshop day creation parameters
 * @returns Created workshop day record
 * @throws Error if not authenticated, not admin, or validation fails
 */
export async function createWorkshopDay(cohortId: string, data: Omit<CreateWorkshopDayParams, 'cohort_id'>) {
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

    // Validate day_number
    if (![1, 2, 3].includes(data.day_number)) {
      throw new Error('day_number must be 1, 2, or 3')
    }

    // Create workshop day with audit fields
    const { data: workshopDay, error: dayError } = await supabase
      .from('workshop_days')
      .insert({
        cohort_id: cohortId,
        day_number: data.day_number,
        title: data.title,
        content_body: data.content_body,
        deliverable_instructions: data.deliverable_instructions,
        deliverable_type: data.deliverable_type || 'pending_confirmation',
        requires_admin_approval: data.requires_admin_approval !== undefined ? data.requires_admin_approval : true,
        created_by: profile.id,
        updated_by: profile.id,
      })
      .select()
      .single()

    if (dayError) {
      console.error('Create workshop day error:', dayError)
      
      // Handle RLS policy violations
      if (dayError.code === '42501') {
        throw new Error('Permission denied: insufficient privileges to create workshop days')
      }
      
      // Handle unique constraint violation
      if (dayError.code === '23505') {
        throw new Error(`Day ${data.day_number} already exists for this cohort`)
      }
      
      throw new Error(`Failed to create workshop day: ${dayError.message}`)
    }

    // Revalidate relevant pages
    revalidatePath(`/admin/pilot-workshops/${cohortId}`)
    revalidatePath(`/admin/pilot-workshops/${cohortId}/edit`)

    return workshopDay
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while creating workshop day')
  }
}

/**
 * Updates an existing workshop day
 * @param dayId - UUID of workshop day to update
 * @param data - Workshop day update parameters
 * @returns Updated workshop day record
 * @throws Error if not authenticated, not admin, or validation fails
 */
export async function updateWorkshopDay(dayId: string, data: Partial<Omit<CreateWorkshopDayParams, 'cohort_id'>>) {
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

    // Validate day_number if provided
    if (data.day_number && ![1, 2, 3].includes(data.day_number)) {
      throw new Error('day_number must be 1, 2, or 3')
    }

    // Update workshop day with updated_by tracking
    const updatePayload: any = {
      ...data,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    }

    const { data: workshopDay, error: dayError } = await supabase
      .from('workshop_days')
      .update(updatePayload)
      .eq('id', dayId)
      .select()
      .single()

    if (dayError) {
      console.error('Update workshop day error:', dayError)
      
      // Handle RLS policy violations
      if (dayError.code === '42501') {
        throw new Error('Permission denied: insufficient privileges to update workshop days')
      }
      
      // Handle unique constraint violation
      if (dayError.code === '23505') {
        throw new Error(`Day ${data.day_number} already exists for this cohort`)
      }
      
      // Handle not found
      if (dayError.code === 'PGRST116') {
        throw new Error('Workshop day not found')
      }
      
      throw new Error(`Failed to update workshop day: ${dayError.message}`)
    }

    // Revalidate relevant pages
    revalidatePath(`/admin/pilot-workshops/${workshopDay.cohort_id}`)
    revalidatePath(`/admin/pilot-workshops/${workshopDay.cohort_id}/edit`)
    revalidatePath(`/admin/pilot-workshops/${workshopDay.cohort_id}/days/${dayId}/edit`)

    return workshopDay
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while updating workshop day')
  }
}

/**
 * Gets all workshop days for a cohort, ordered by day_number
 * @param cohortId - UUID of the cohort
 * @returns Array of workshop days with media
 * @throws Error if not authenticated
 */
export async function getWorkshopDays(cohortId: string) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error('Authentication required')
    }

    const supabase = createServerSupabaseClient()

    // Get workshop days with media, ordered by day_number
    const { data: days, error: daysError } = await supabase
      .from('workshop_days')
      .select(`
        *,
        workshop_day_media(*)
      `)
      .eq('cohort_id', cohortId)
      .order('day_number', { ascending: true })

    if (daysError) {
      console.error('Get workshop days error:', daysError)
      throw new Error(`Failed to fetch workshop days: ${daysError.message}`)
    }

    // Sort media by sort_order within each day
    return (days || []).map(day => ({
      ...day,
      workshop_day_media: (day.workshop_day_media || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
    }))
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while fetching workshop days')
  }
}

/**
 * Uploads a file to Supabase Storage and creates a media record
 * @param dayId - UUID of workshop day
 * @param file - File to upload
 * @param mediaType - Type of media ('pdf' or 'image')
 * @param label - Optional label for the media
 * @returns Created media record
 * @throws Error if not authenticated, not admin, or upload fails
 */
export async function uploadDayMedia(
  dayId: string,
  file: File,
  mediaType: 'pdf' | 'image',
  label?: string
) {
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

    // Validate media type
    if (!['pdf', 'image'].includes(mediaType)) {
      throw new Error('Media type must be pdf or image for file uploads')
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${dayId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `workshop-media/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('content-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('content-uploads')
      .getPublicUrl(filePath)

    // Get current max sort_order for this day
    const { data: existingMedia } = await supabase
      .from('workshop_day_media')
      .select('sort_order')
      .eq('workshop_day_id', dayId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = existingMedia && existingMedia.length > 0 
      ? existingMedia[0].sort_order + 1 
      : 0

    // Create media record
    const { data: media, error: mediaError } = await supabase
      .from('workshop_day_media')
      .insert({
        workshop_day_id: dayId,
        media_type: mediaType,
        url: urlData.publicUrl,
        storage_path: filePath,
        label: label || null,
        sort_order: nextSortOrder,
      })
      .select()
      .single()

    if (mediaError) {
      console.error('Create media record error:', mediaError)
      
      // Clean up uploaded file if media record creation fails
      await supabase.storage.from('content-uploads').remove([filePath])
      
      throw new Error(`Failed to create media record: ${mediaError.message}`)
    }

    // Revalidate relevant pages
    const { data: day } = await supabase
      .from('workshop_days')
      .select('cohort_id')
      .eq('id', dayId)
      .single()
    
    if (day) {
      revalidatePath(`/admin/pilot-workshops/${day.cohort_id}/days/${dayId}/edit`)
    }

    return media
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while uploading media')
  }
}

/**
 * Adds external media (video link or external link) to a workshop day
 * @param dayId - UUID of workshop day
 * @param url - External URL
 * @param mediaType - Type of media ('video_link' or 'external_link')
 * @param label - Optional label for the media
 * @returns Created media record
 * @throws Error if not authenticated or not admin
 */
export async function addExternalMedia(
  dayId: string,
  url: string,
  mediaType: 'video_link' | 'external_link',
  label?: string
) {
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

    // Validate media type
    if (!['video_link', 'external_link'].includes(mediaType)) {
      throw new Error('Media type must be video_link or external_link for external URLs')
    }

    // Get current max sort_order for this day
    const { data: existingMedia } = await supabase
      .from('workshop_day_media')
      .select('sort_order')
      .eq('workshop_day_id', dayId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = existingMedia && existingMedia.length > 0 
      ? existingMedia[0].sort_order + 1 
      : 0

    // Create media record
    const { data: media, error: mediaError } = await supabase
      .from('workshop_day_media')
      .insert({
        workshop_day_id: dayId,
        media_type: mediaType,
        url: url,
        storage_path: null,
        label: label || null,
        sort_order: nextSortOrder,
      })
      .select()
      .single()

    if (mediaError) {
      console.error('Create media record error:', mediaError)
      
      // Handle RLS policy violations
      if (mediaError.code === '42501') {
        throw new Error('Permission denied: insufficient privileges to add media')
      }
      
      throw new Error(`Failed to create media record: ${mediaError.message}`)
    }

    // Revalidate relevant pages
    const { data: day } = await supabase
      .from('workshop_days')
      .select('cohort_id')
      .eq('id', dayId)
      .single()
    
    if (day) {
      revalidatePath(`/admin/pilot-workshops/${day.cohort_id}/days/${dayId}/edit`)
    }

    return media
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while adding external media')
  }
}

/**
 * Deletes a media item and its associated file from storage
 * @param mediaId - UUID of media to delete
 * @throws Error if not authenticated or not admin
 */
export async function deleteDayMedia(mediaId: string) {
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

    // Get media record to check for storage file
    const { data: media, error: getError } = await supabase
      .from('workshop_day_media')
      .select('*, workshop_days!inner(cohort_id)')
      .eq('id', mediaId)
      .single()

    if (getError) {
      throw new Error('Media not found')
    }

    // Delete file from storage if it exists
    if (media.storage_path) {
      const { error: storageError } = await supabase
        .storage
        .from('workshop-media')
        .remove([media.storage_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete media record (cascade handled by database)
    const { error: deleteError } = await supabase
      .from('workshop_day_media')
      .delete()
      .eq('id', mediaId)

    if (deleteError) {
      console.error('Delete media error:', deleteError)
      
      // Handle RLS policy violations
      if (deleteError.code === '42501') {
        throw new Error('Permission denied: insufficient privileges to delete media')
      }
      
      throw new Error(`Failed to delete media: ${deleteError.message}`)
    }

    // Revalidate relevant pages
    if (media.workshop_days) {
      revalidatePath(`/admin/pilot-workshops/${media.workshop_days.cohort_id}/days/${media.workshop_day_id}/edit`)
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while deleting media')
  }
}

/**
 * Updates the sort order of media items for a workshop day
 * @param dayId - UUID of workshop day
 * @param mediaItems - Array of media IDs with new sort orders
 * @throws Error if not authenticated or not admin
 */
export async function updateMediaSortOrder(
  dayId: string,
  mediaItems: Array<{ id: string; sort_order: number }>
) {
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

    // Update each media item's sort order
    const updatePromises = mediaItems.map(item =>
      supabase
        .from('workshop_day_media')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('workshop_day_id', dayId) // Ensure media belongs to this day
    )

    const results = await Promise.all(updatePromises)
    
    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Update sort order errors:', errors)
      throw new Error('Failed to update some media sort orders')
    }

    // Revalidate relevant pages
    const { data: day } = await supabase
      .from('workshop_days')
      .select('cohort_id')
      .eq('id', dayId)
      .single()
    
    if (day) {
      revalidatePath(`/admin/pilot-workshops/${day.cohort_id}/days/${dayId}/edit`)
    }

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while updating media sort order')
  }
}
