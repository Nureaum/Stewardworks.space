'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { CreateSectionParams, UpdateSectionParams } from '@/types/workshops'
import { revalidatePath } from 'next/cache'

/**
 * Creates a new section for a workshop day
 * @param dayId - UUID of the workshop day
 * @param data - Section creation parameters (excluding workshop_day_id)
 * @returns Created section record
 */
export async function createSection(dayId: string, data: Omit<CreateSectionParams, 'workshop_day_id'>) {
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

    // Auto-calculate sort_order
    const { count } = await supabase
      .from('workshop_day_sections')
      .select('*', { count: 'exact', head: true })
      .eq('workshop_day_id', dayId)

    const { data: section, error: sectionError } = await supabase
      .from('workshop_day_sections')
      .insert({
        workshop_day_id: dayId,
        section_key: data.section_key,
        hour: data.hour || null,
        title: data.title,
        duration: data.duration || null,
        sort_order: (count || 0) + 1,
      })
      .select()
      .single()

    if (sectionError) {
      console.error('Create section error:', sectionError)
      if (sectionError.code === '42501') throw new Error('Permission denied: insufficient privileges')
      throw new Error(`Failed to create section: ${sectionError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return section
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while creating section')
  }
}

/**
 * Updates an existing section
 * @param sectionId - UUID of the section to update
 * @param data - Section update parameters (excluding id)
 * @returns Updated section record
 */
export async function updateSection(sectionId: string, data: Omit<UpdateSectionParams, 'id'>) {
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

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (data.hour !== undefined) updateData.hour = data.hour
    if (data.title !== undefined) updateData.title = data.title
    if (data.duration !== undefined) updateData.duration = data.duration

    const { data: section, error: sectionError } = await supabase
      .from('workshop_day_sections')
      .update(updateData)
      .eq('id', sectionId)
      .select()
      .single()

    if (sectionError) {
      console.error('Update section error:', sectionError)
      throw new Error(`Failed to update section: ${sectionError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return section
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while updating section')
  }
}

/**
 * Deletes a section and all its entries (cascade)
 * @param sectionId - UUID of the section to delete
 * @returns { success: true }
 */
export async function deleteSection(sectionId: string) {
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

    // Get all entries in this section to delete their media first
    const { data: entries } = await supabase
      .from('workshop_day_entries')
      .select('id')
      .eq('section_id', sectionId)

    if (entries && entries.length > 0) {
      const entryIds = entries.map(e => e.id)

      // Delete entry media
      await supabase
        .from('workshop_entry_media')
        .delete()
        .in('entry_id', entryIds)

      // Delete entries
      await supabase
        .from('workshop_day_entries')
        .delete()
        .eq('section_id', sectionId)
    }

    // Delete the section itself
    const { error: deleteError } = await supabase
      .from('workshop_day_sections')
      .delete()
      .eq('id', sectionId)

    if (deleteError) {
      console.error('Delete section error:', deleteError)
      throw new Error(`Failed to delete section: ${deleteError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while deleting section')
  }
}

/**
 * Reorders sections within a workshop day
 * @param dayId - UUID of the workshop day
 * @param items - Array of { id, sort_order } pairs
 * @returns { success: true }
 */
export async function reorderSections(dayId: string, items: Array<{ id: string; sort_order: number }>) {
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

    for (const item of items) {
      const { error } = await supabase
        .from('workshop_day_sections')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('workshop_day_id', dayId)

      if (error) {
        console.error('Reorder section error:', error)
        throw new Error(`Failed to reorder sections: ${error.message}`)
      }
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while reordering sections')
  }
}
