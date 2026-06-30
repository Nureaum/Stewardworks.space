'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { HelpdeskNotification } from '@/types/helpdesk'

async function getProfileId() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const supabase = createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()
  
  if (!profile) throw new Error('Profile not found')
  return profile
}

export async function getMyNotifications(): Promise<HelpdeskNotification[]> {
  const profile = await getProfileId()
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('helpdesk_notifications')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as HelpdeskNotification[]
}

export async function markNotificationAsRead(id: string) {
  const profile = await getProfileId()
  const supabase = createServerSupabaseClient()
  
  const { error } = await supabase
    .from('helpdesk_notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', profile.id)
    
  if (error) throw error
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const profile = await getProfileId()
    const supabase = createServerSupabaseClient()
    
    const { count, error } = await supabase
      .from('helpdesk_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      
    if (error) throw error
    return count || 0
  } catch (e) {
    return 0
  }
}
