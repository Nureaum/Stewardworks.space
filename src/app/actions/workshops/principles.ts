'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { CreatePrincipleParams, UpdatePrincipleParams } from '@/types/workshops'
import { revalidatePath } from 'next/cache'

/**
 * Gets all principles for a cohort
 * @param cohortId - UUID of the cohort
 * @returns Array of principle records
 */
export async function getPrinciples(cohortId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Authentication required')

    const supabase = createServerSupabaseClient()

    const { data: principles, error } = await supabase
      .from('workshop_principles')
      .select('*')
      .eq('cohort_id', cohortId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Get principles error:', error)
      throw new Error(`Failed to get principles: ${error.message}`)
    }

    return principles || []
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while fetching principles')
  }
}

/**
 * Creates a new principle for a cohort
 * @param data - Principle creation parameters
 * @returns Created principle record
 */
export async function createPrinciple(data: CreatePrincipleParams) {
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
      .from('workshop_principles')
      .select('*', { count: 'exact', head: true })
      .eq('cohort_id', data.cohort_id)

    const { data: principle, error: principleError } = await supabase
      .from('workshop_principles')
      .insert({
        cohort_id: data.cohort_id,
        name: data.name,
        description: data.description || null,
        example: data.example || null,
        sort_order: (count || 0) + 1,
      })
      .select()
      .single()

    if (principleError) {
      console.error('Create principle error:', principleError)
      if (principleError.code === '42501') throw new Error('Permission denied: insufficient privileges')
      throw new Error(`Failed to create principle: ${principleError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return principle
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while creating principle')
  }
}

/**
 * Updates an existing principle
 * @param principleId - UUID of the principle to update
 * @param data - Principle update parameters (excluding id)
 * @returns Updated principle record
 */
export async function updatePrinciple(principleId: string, data: Omit<UpdatePrincipleParams, 'id'>) {
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

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.example !== undefined) updateData.example = data.example

    const { data: principle, error: principleError } = await supabase
      .from('workshop_principles')
      .update(updateData)
      .eq('id', principleId)
      .select()
      .single()

    if (principleError) {
      console.error('Update principle error:', principleError)
      throw new Error(`Failed to update principle: ${principleError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return principle
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while updating principle')
  }
}

/**
 * Deletes a principle and its junction table references
 * @param principleId - UUID of the principle to delete
 * @returns { success: true }
 */
export async function deletePrinciple(principleId: string) {
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

    // Delete from junction table first
    await supabase
      .from('workshop_progress_principles')
      .delete()
      .eq('principle_id', principleId)

    // Delete the principle itself
    const { error: deleteError } = await supabase
      .from('workshop_principles')
      .delete()
      .eq('id', principleId)

    if (deleteError) {
      console.error('Delete principle error:', deleteError)
      throw new Error(`Failed to delete principle: ${deleteError.message}`)
    }

    revalidatePath('/hub/pilot-workshops')
    revalidatePath('/admin/pilot-workshops')

    return { success: true }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('An unexpected error occurred while deleting principle')
  }
}
