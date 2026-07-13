'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SaveCharacterParams, WorkshopCharacter } from '@/types/workshops'

/**
 * Save (upsert) a character for the current user in a cohort.
 * If a character already exists for this user+cohort, it updates it.
 * Otherwise it creates a new one.
 */
export async function saveCharacter(
  params: SaveCharacterParams
): Promise<{ success: boolean; data?: WorkshopCharacter; error?: string }> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const supabase = createServerSupabaseClient()

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!profile) return { success: false, error: 'Profile not found' }

    // Check if character exists
    const { data: existing } = await supabase
      .from('workshop_characters')
      .select('id')
      .eq('cohort_id', params.cohort_id)
      .eq('profile_id', profile.id)
      .maybeSingle()

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('workshop_characters')
        .update({
          character_key: params.character_key,
          player_name: params.player_name,
          accent_color: params.accent_color,
          tint: params.tint,
          headgear: params.headgear,
          loadout: params.loadout,
          outfit: params.outfit,
          hair: params.hair,
          hair_color: params.hair_color,
          facial: params.facial,
          companion: params.companion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) return { success: false, error: error.message }

      revalidatePath('/hub/pilot-workshops')
      return { success: true, data: data as WorkshopCharacter }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('workshop_characters')
        .insert({
          cohort_id: params.cohort_id,
          profile_id: profile.id,
          character_key: params.character_key,
          player_name: params.player_name,
          accent_color: params.accent_color,
          tint: params.tint,
          headgear: params.headgear,
          loadout: params.loadout,
          outfit: params.outfit,
          hair: params.hair,
          hair_color: params.hair_color,
          facial: params.facial,
          companion: params.companion,
        })
        .select()
        .single()

      if (error) return { success: false, error: error.message }

      revalidatePath('/hub/pilot-workshops')
      return { success: true, data: data as WorkshopCharacter }
    }
  } catch (err) {
    console.error('saveCharacter error:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
