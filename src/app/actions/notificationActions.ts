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
    .select('id')
    .eq('clerk_user_id', userId)
    .single()
  
  if (!profile) throw new Error('Profile not found')
  return profile.id
}

export async function getUnreadNotifications(): Promise<HelpdeskNotification[]> {
  try {
    const profileId = await getProfileId()
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('helpdesk_notifications')
      .select('*')
      .eq('user_id', profileId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as HelpdeskNotification[]
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

export async function markNotificationAsRead(id: string) {
  const profileId = await getProfileId()
  const supabase = createServerSupabaseClient()
  
  const { error } = await supabase
    .from('helpdesk_notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', profileId)

  if (error) throw error
}

export async function markAllNotificationsAsRead() {
  const profileId = await getProfileId()
  const supabase = createServerSupabaseClient()
  
  const { error } = await supabase
    .from('helpdesk_notifications')
    .update({ is_read: true })
    .eq('user_id', profileId)
    .eq('is_read', false)

  if (error) throw error
}
