'use server'

import { createServerSupabaseClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

// Save a session (create or update)
export async function saveSessionAction(data: any) {
  const supabase = createServerSupabaseClient()
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Ensure 'published' is true by default so it shows on the wall
  const payload = {
    ...data,
    published: true,
  }

  const { id, quotes, photos, suggestions, quote_count, suggestion_count, ...rest } = payload;
  let response;
  
  // If id is provided and it's not a generic mock- id, update
  if (id && !id.toString().startsWith('mock-')) {
    response = await supabase.from('listening_sessions').update(rest).eq('id', id).select().single();
  } else {
    // Insert new
    response = await supabase.from('listening_sessions').insert(rest).select().single();
  }
  
  if (response.error) {
    console.error('saveSession error:', response.error);
    throw new Error(response.error.message);
  }
  
  const sessionId = response.data.id;

  // Sync related records
  // 1. Sync quotes
  if (quotes && Array.isArray(quotes)) {
    await supabase.from('session_quotes').delete().eq('session_id', sessionId);
    if (quotes.length > 0) {
      const newQuotes = quotes.map((q: any) => ({
        session_id: sessionId,
        quote: q.quote || q.text, // Handle frontend key
        profile: q.profile,
        has_audio: q.has_audio || !!q.audio_url,
        audio_url: q.audio_url || null
      }));
      await supabase.from('session_quotes').insert(newQuotes);
    }
  }

  // 2. Sync photos
  if (photos && Array.isArray(photos)) {
    await supabase.from('session_photos').delete().eq('session_id', sessionId);
    if (photos.length > 0) {
      const newPhotos = photos.map((p: any) => ({
        session_id: sessionId,
        storage_path: p.storage_path || p.img, // Handle frontend key
        caption: p.caption || p.cap
      }));
      await supabase.from('session_photos').insert(newPhotos);
    }
  }

  // 3. Sync suggestions
  if (suggestions && Array.isArray(suggestions)) {
    await supabase.from('integrations').delete().eq('session_id', sessionId);
    if (suggestions.length > 0) {
      // Get a default area id in case one is missing
      const { data: fallbackArea } = await supabase.from('project_areas').select('id').limit(1).single();
      const defaultAreaId = fallbackArea ? fallbackArea.id : null;

      const newIntegrations = suggestions.map((s: any) => {
        let areaId = (s.project_area_id || s.area_id);
        if (!areaId) areaId = defaultAreaId;
        return {
          source_type: 'session',
          session_id: sessionId,
          quote: s.quote || '',
          voice: s.voice || '',
          integration_note: s.integration_note || s.note || '',
          area_id: areaId
        };
      }).filter((s: any) => s.area_id); // Only insert if we have a valid area_id

      if (newIntegrations.length > 0) {
        const { error: intErr } = await supabase.from('integrations').insert(newIntegrations);
        if (intErr) console.error('integrations sync error:', intErr);
      }
    }
  }

  revalidatePath('/hub/community-listening', 'layout');
  revalidatePath('/admin/community-listening', 'layout');
  return { success: true, data: response.data }
}

// Delete a session
export async function deleteSessionAction(id: string) {
  const supabase = createServerSupabaseClient()
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Skip deleting mock sessions from DB since they don't exist
  if (id.startsWith('mock-')) {
    return { success: true };
  }

  const { error } = await supabase.from('listening_sessions').delete().eq('id', id);
  
  if (error) {
    console.error('deleteSession error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/hub/community-listening')
  return { success: true }
}

// Update a submission (for Suggestion Inbox)
export async function updateSubmissionAction(id: string, updates: any) {
  const supabase = createServerSupabaseClient()
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase.from('public_submissions').update(updates).eq('id', id);
  
  if (error) {
    console.error('updateSubmission error:', error);
    throw new Error(error.message);
  }

  revalidatePath('/hub/community-listening', 'layout');
  revalidatePath('/admin/community-listening', 'layout');
  return { success: true }
}
