'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { AILab, AILabWithCohort, CreateAILabParams, UpdateAILabParams } from '@/types/workshops'
import { revalidatePath } from 'next/cache'

export async function getAILabs(): Promise<AILabWithCohort[]> {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('ai_labs')
    .select(`
      *,
      cohorts (
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching AI labs:', error)
    throw new Error('Failed to fetch AI labs')
  }

  return (data || []).map(lab => ({
    ...lab,
    cohort_name: lab.cohorts?.name || 'Unknown Cohort'
  }))
}

export async function getAILab(id: string): Promise<AILabWithCohort> {
  const supabase = createServerSupabaseClient()
  
  const { data, error } = await supabase
    .from('ai_labs')
    .select(`
      *,
      cohorts (
        name
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching AI lab:', error)
    throw new Error('Failed to fetch AI lab')
  }

  return {
    ...data,
    cohort_name: data.cohorts?.name || 'Unknown Cohort'
  }
}

export async function createAILab(params: CreateAILabParams): Promise<AILab> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()
  
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

  const { data, error } = await supabase
    .from('ai_labs')
    .insert([{
      cohort_id: params.cohort_id,
      title: params.title,
      content: params.content,
      created_by: profile.id
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating AI lab:', error)
    throw new Error(`Failed to create AI lab: ${error.message}`)
  }

  revalidatePath('/admin/ai-labs')
  revalidatePath('/hub/ai-lab')

  return data
}

export async function updateAILab(params: UpdateAILabParams): Promise<AILab> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()
  
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

  const { data, error } = await supabase
    .from('ai_labs')
    .update({
      cohort_id: params.cohort_id,
      title: params.title,
      content: params.content
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating AI lab:', error)
    throw new Error(`Failed to update AI lab: ${error.message}`)
  }

  revalidatePath('/admin/ai-labs')
  revalidatePath('/hub/ai-lab')

  return data
}

export async function deleteAILab(id: string): Promise<void> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Authentication required')
  }

  const supabase = createServerSupabaseClient()
  
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

  const { error } = await supabase
    .from('ai_labs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting AI lab:', error)
    throw new Error(`Failed to delete AI lab: ${error.message}`)
  }
  
  revalidatePath('/admin/ai-labs')
  revalidatePath('/hub/ai-lab')
}
