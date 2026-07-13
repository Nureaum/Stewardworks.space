'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Gets all engagement items for the current user in a cohort
 */
export async function getEngagements(cohortId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Authentication required')
  
  const supabase = createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()
  
  if (!profile) throw new Error('Profile not found')
  
  const { data, error } = await supabase
    .from('workshop_engagement')
    .select('*')
    .eq('cohort_id', cohortId)
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Get engagements error:', error)
    return []
  }
  
  return data || []
}

/**
 * Adds a new engagement item (bookmark, note, prompt, or generation)
 */
export async function addEngagement(cohortId: string, kind: string, title: string, source?: string, url?: string, content?: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Authentication required')
  
  const supabase = createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()
  
  if (!profile) throw new Error('Profile not found')
  
  const { data, error } = await supabase
    .from('workshop_engagement')
    .insert({
      cohort_id: cohortId,
      profile_id: profile.id,
      kind,
      title,
      source: source || '',
      url: url || '',
      content: content || '',
      status: 'pending',
    })
    .select()
    .single()
  
  if (error) {
    console.error('Add engagement error:', error)
    throw new Error(`Failed to add engagement: ${error.message}`)
  }
  
  revalidatePath('/hub/pilot-workshops')
  return data
}

/**
 * Removes an engagement item
 */
export async function removeEngagement(engagementId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Authentication required')
  
  const supabase = createServerSupabaseClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()
  
  if (!profile) throw new Error('Profile not found')
  
  const { error } = await supabase
    .from('workshop_engagement')
    .delete()
    .eq('id', engagementId)
    .eq('profile_id', profile.id)
  
  if (error) {
    console.error('Remove engagement error:', error)
    throw new Error(`Failed to remove engagement: ${error.message}`)
  }
  
  revalidatePath('/hub/pilot-workshops')
  return { success: true }
}

export async function uploadCreationImage(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Authentication required');

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  const supabase = createServerSupabaseClient();
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `ai-labs/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('content-uploads')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('content-uploads')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Updates an engagement item
 * Note: Does NOT reset approval status - edits preserve the existing status
 */
export async function updateEngagement(engagementId: string, updates: { title?: string, content?: string, url?: string }) {
  console.log('[Server] updateEngagement CALLED')
  console.log('[Server] engagementId:', engagementId)
  console.log('[Server] updates:', updates)
  
  const { userId } = await auth()
  console.log('[Server] userId:', userId)
  
  if (!userId) {
    console.error('[Server] No userId - authentication required')
    throw new Error('Authentication required')
  }
  
  const supabase = createServerSupabaseClient()
  
  console.log('[Server] Fetching profile...')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()
  
  console.log('[Server] Profile:', profile)
  console.log('[Server] Profile error:', profileError)
  
  if (!profile) {
    console.error('[Server] Profile not found')
    throw new Error('Profile not found')
  }
  
  // Only update the provided fields, do NOT reset status
  console.log('[Server] Updating engagement in database...')
  const { data, error } = await supabase
    .from('workshop_engagement')
    .update(updates)
    .eq('id', engagementId)
    .eq('profile_id', profile.id) // Security check
    .select()
    .single()
  
  console.log('[Server] Update result:', data)
  console.log('[Server] Update error:', error)
  
  if (error) {
    console.error('[Server] Update engagement error:', error)
    throw new Error(`Failed to update engagement: ${error.message}`)
  }
  
  console.log('[Server] Revalidating path...')
  revalidatePath('/hub/pilot-workshops')
  
  console.log('[Server] Returning updated data:', data)
  return data
}
