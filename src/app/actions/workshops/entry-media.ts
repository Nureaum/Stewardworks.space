'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { CreateEntryMediaParams } from '@/types/workshops'
import { revalidatePath } from 'next/cache'

/**
 * Creates a new media item for an entry
 * @param entryId - UUID of the entry
 * @param data - Media creation parameters (excluding entry_id)
 * @returns Created media record
 */
export async function createEntryMedia(entryId: string, data: Omit<CreateEntryMediaParams, 'entry_id'>) {
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
      .from('workshop_entry_media')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entryId)

    const { data: media, error: mediaError } = await supabase
      .from('workshop_entry_media')
      .insert({
        entry_id: entryId,
        kind: data.kind,
        label: data.label || null,
        url: data.url || null,
        sort_order: (count || 0) + 1,
      })
      .select()
      .single()

    if (mediaError) {
      console.error('Create entry media error:', mediaError)
      if (mediaError.code === '42501') throw new Error('Permission denied: insufficient privileges')
      throw new Error(`Failed to create entry media: ${mediaError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return media
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while creating entry media')
  }
}

/**
 * Uploads a file to Supabase Storage and creates an entry media record
 * @param formData - FormData containing entryId, file, kind, and optional label
 * @returns Created media record
 */
export async function uploadEntryMedia(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Authentication required')

    const entryId = formData.get('entryId') as string
    const file = formData.get('file') as File
    const kind = formData.get('kind') as 'photo' | 'video' | 'audio'
    const label = formData.get('label') as string || null

    if (!entryId || !file || !kind) {
      throw new Error('Missing required fields')
    }

    const supabase = createServerSupabaseClient()
    const { data: profile } = await supabase.from('profiles').select('id, role').eq('clerk_user_id', userId).single()
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) throw new Error('Admin access required')

    // Upload file
    const fileExt = file.name.split('.').pop()
    const fileName = `${entryId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `workshop-media/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('content-uploads')
      .upload(filePath, file, { 
        cacheControl: '3600', 
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      })

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    // Get public URL
    const { data: urlData } = supabase.storage.from('content-uploads').getPublicUrl(filePath)

    // Get max sort order
    const { count, error: countError } = await supabase.from('workshop_entry_media').select('*', { count: 'exact', head: true }).eq('entry_id', entryId)
    if (countError) console.error('Count error:', countError)

    // Create DB record with retry
    let media = null
    let mediaError = null
    
    for (let i = 0; i < 3; i++) {
      const res = await supabase
        .from('workshop_entry_media')
        .insert({
          entry_id: entryId,
          kind,
          label,
          url: urlData.publicUrl,
          storage_path: filePath,
          sort_order: (count || 0) + 1,
        })
        .select()
        .single()
        
      media = res.data
      mediaError = res.error
      
      if (!mediaError || !mediaError.message.includes('fetch failed')) break
      
      // Wait before retry
      await new Promise(r => setTimeout(r, 1000))
    }

    if (mediaError) {
      await supabase.storage.from('content-uploads').remove([filePath])
      throw new Error(`DB insert failed: ${mediaError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')
    
    return media
  } catch (error) {
    console.error('uploadEntryMedia error:', error)
    throw error
  }
}

/**
 * Gets media items for a specific entry
 * @param entryId - UUID of the entry
 * @returns Array of media records
 */
export async function getEntryMedia(entryId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('workshop_entry_media')
      .select('*')
      .eq('entry_id', entryId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Fetch entry media error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch entry media:', error)
    return []
  }
}

/**
 * Deletes entry media, including storage file if exists
 * @param mediaId - UUID of the media to delete
 * @returns { success: true }
 */
export async function deleteEntryMedia(mediaId: string) {
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

    // Get media record to check for storage_path
    const { data: media } = await supabase
      .from('workshop_entry_media')
      .select('storage_path')
      .eq('id', mediaId)
      .single()

    // Delete from storage if exists
    if (media?.storage_path) {
      await supabase.storage
        .from('workshop-media')
        .remove([media.storage_path])
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from('workshop_entry_media')
      .delete()
      .eq('id', mediaId)

    if (deleteError) {
      console.error('Delete entry media error:', deleteError)
      throw new Error(`Failed to delete entry media: ${deleteError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while deleting entry media')
  }
}

/**
 * Reorders media within an entry
 * @param entryId - UUID of the entry
 * @param items - Array of { id, sort_order } pairs
 * @returns { success: true }
 */
export async function reorderEntryMedia(entryId: string, items: Array<{ id: string; sort_order: number }>) {
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
        .from('workshop_entry_media')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('entry_id', entryId)

      if (error) {
        console.error('Reorder entry media error:', error)
        throw new Error(`Failed to reorder entry media: ${error.message}`)
      }
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while reordering entry media')
  }
}
