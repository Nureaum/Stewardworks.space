'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Gets the showcase headers settings
 */
export async function getShowcaseSettings() {
  const supabase = createServerSupabaseClient()
  
  // We don't cache this so it live-updates as requested
  const { data, error } = await supabase
    .from('showcase_settings')
    .select('*')
    .eq('id', 'global')
    .single()
  
  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Get showcase settings error:', error)
    }
    return null
  }
  
  return data
}

/**
 * Updates the showcase headers settings (Admin only)
 */
export async function updateShowcaseSettings(settings: {
  contributors_title?: string
  contributors_description?: string
  student_title?: string
  student_description?: string
  tally_link?: string
  show_tally_link?: boolean
}) {
  const { userId } = await auth()
  if (!userId) throw new Error('Authentication required')
  
  const supabase = createServerSupabaseClient()
  
  // Check admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()
    
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Unauthorized: Admin access required')
  }

  // Ensure row exists, or update it
  const { data, error } = await supabase
    .from('showcase_settings')
    .upsert({ id: 'global', ...settings })
    .select()
    .single()
    
  if (error) {
    console.error('Update showcase settings error:', error)
    throw new Error(`Failed to update showcase settings: ${error.message}`)
  }
  
  // Revalidate common paths where Showcase is used
  revalidatePath('/hub/pilot-workshops', 'layout')
  
  return data
}
