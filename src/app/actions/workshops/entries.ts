'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { CreateEntryParams, UpdateEntryParams } from '@/types/workshops'
import { revalidatePath } from 'next/cache'

/**
 * Creates a new entry within a section
 * @param sectionId - UUID of the section
 * @param data - Entry creation parameters (excluding section_id)
 * @returns Created entry record
 */
export async function createEntry(sectionId: string, data: Omit<CreateEntryParams, 'section_id'>) {
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
      .from('workshop_day_entries')
      .select('*', { count: 'exact', head: true })
      .eq('section_id', sectionId)

    const { data: entry, error: entryError } = await supabase
      .from('workshop_day_entries')
      .insert({
        section_id: sectionId,
        entry_type: data.entry_type || 'text',
        title: data.title || 'New Entry',
        sort_order: (count || 0) + 1,
      })
      .select()
      .single()

    if (entryError) {
      console.error('Create entry error:', entryError)
      if (entryError.code === '42501') throw new Error('Permission denied: insufficient privileges')
      throw new Error(`Failed to create entry: ${entryError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return entry
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while creating entry')
  }
}

/**
 * Updates an existing entry
 * @param entryId - UUID of the entry to update
 * @param data - Entry update parameters (excluding id)
 * @returns Updated entry record
 */
export async function updateEntry(entryId: string, data: Omit<UpdateEntryParams, 'id'>) {
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
    if (data.entry_type !== undefined) updateData.entry_type = data.entry_type
    if (data.title !== undefined) updateData.title = data.title
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle
    if (data.body !== undefined) updateData.body = data.body
    if (data.items !== undefined) updateData.items = data.items
    if (data.modern_title !== undefined) updateData.modern_title = data.modern_title
    if (data.modern_body !== undefined) updateData.modern_body = data.modern_body
    if (data.ancient_title !== undefined) updateData.ancient_title = data.ancient_title
    if (data.ancient_body !== undefined) updateData.ancient_body = data.ancient_body
    if (data.framework !== undefined) updateData.framework = data.framework
    if (data.contrib_id !== undefined) updateData.contrib_id = data.contrib_id
    if (data.note !== undefined) updateData.note = data.note
    if (data.goal !== undefined) updateData.goal = data.goal
    if (data.applied !== undefined) updateData.applied = data.applied
    if (data.lab !== undefined) updateData.lab = data.lab
    if (data.submit_label !== undefined) updateData.submit_label = data.submit_label

    const { data: entry, error: entryError } = await supabase
      .from('workshop_day_entries')
      .update(updateData)
      .eq('id', entryId)
      .select()
      .single()

    if (entryError) {
      console.error('Update entry error:', entryError)
      throw new Error(`Failed to update entry: ${entryError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return entry
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while updating entry')
  }
}

/**
 * Deletes an entry and all its media (cascade)
 * @param entryId - UUID of the entry to delete
 * @returns { success: true }
 */
export async function deleteEntry(entryId: string) {
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

    // Delete entry media first
    await supabase
      .from('workshop_entry_media')
      .delete()
      .eq('entry_id', entryId)

    // Delete the entry itself
    const { error: deleteError } = await supabase
      .from('workshop_day_entries')
      .delete()
      .eq('id', entryId)

    if (deleteError) {
      console.error('Delete entry error:', deleteError)
      throw new Error(`Failed to delete entry: ${deleteError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while deleting entry')
  }
}

/**
 * Reorders entries within a section
 * @param sectionId - UUID of the section
 * @param items - Array of { id, sort_order } pairs
 * @returns { success: true }
 */
export async function reorderEntries(sectionId: string, items: Array<{ id: string; sort_order: number }>) {
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
        .from('workshop_day_entries')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('section_id', sectionId)

      if (error) {
        console.error('Reorder entry error:', error)
        throw new Error(`Failed to reorder entries: ${error.message}`)
      }
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while reordering entries')
  }
}
