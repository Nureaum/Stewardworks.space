'use server';

import { createServerSupabaseClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function toggleBookmark(itemId: string, itemType: string, resourceTitle?: string, resourceUrl?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const supabase = createServerSupabaseClient();
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (!profile) throw new Error('Profile not found');

  // For library and workforce bookmarks, create engagement record instead of simple bookmark
  if (itemType === 'library' || itemType === 'workforce' || itemType === 'environmental') {
    // Get active cohort
    const { data: activeCohort } = await supabase
      .from('cohorts')
      .select('id')
      .in('status', ['open', 'completed'])
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!activeCohort) {
      throw new Error('No active cohort found');
    }

    // Check if bookmark engagement already exists
    const { data: existing } = await supabase
      .from('workshop_engagement')
      .select('id, status')
      .eq('profile_id', profile.id)
      .eq('cohort_id', activeCohort.id)
      .eq('kind', 'bookmark')
      .eq('url', resourceUrl || itemId)
      .maybeSingle();

    if (existing) {
      // Remove bookmark engagement
      const { error } = await supabase
        .from('workshop_engagement')
        .delete()
        .eq('id', existing.id);
      
      if (error) {
        console.error('Error removing bookmark:', error);
        throw new Error('Failed to remove bookmark');
      }
      return { status: 'removed' };
    } else {
      // Create new bookmark engagement with pending status
      const { error } = await supabase
        .from('workshop_engagement')
        .insert({
          profile_id: profile.id,
          cohort_id: activeCohort.id,
          kind: 'bookmark',
          title: resourceTitle || `${itemType === 'workforce' ? 'Workforce' : itemType === 'environmental' ? 'Environmental' : 'Library'} Resource ${itemId}`,
          content: resourceTitle || `${itemType === 'workforce' ? 'Workforce' : itemType === 'environmental' ? 'Environmental' : 'Library'} Resource ${itemId}`,
          url: resourceUrl || itemId,
          source: itemType,
          status: 'pending'
        });

      if (error) {
        console.error('Error adding bookmark:', error);
        throw new Error('Failed to add bookmark');
      }
      return { status: 'added' };
    }
  }
  
  // For other types, use old bookmark system
  const { data: existing, error: checkError } = await supabase.from('user_bookmarks')
    .select('id').eq('user_id', userId).eq('item_id', itemId).eq('item_type', itemType).maybeSingle();
    
  if (checkError) {
    console.error('Error checking bookmark:', checkError);
  }
    
  if (existing) {
    const { error } = await supabase.from('user_bookmarks').delete().eq('id', existing.id);
    if (error) console.error('Error removing bookmark:', error);
    return { status: 'removed' };
  } else {
    const { error } = await supabase.from('user_bookmarks').insert({ user_id: userId, item_id: itemId, item_type: itemType });
    if (error) console.error('Error adding bookmark:', error);
    return { status: 'added' };
  }
}

export async function fetchUserBookmarks(itemType?: string) {
  const { userId } = await auth();
  if (!userId) return [];
  const supabase = createServerSupabaseClient();
  
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (!profile) return [];

  // For library and workforce bookmarks, fetch from workshop_engagement
  if (itemType === 'library' || itemType === 'workforce' || itemType === 'environmental') {
    // Get active cohort
    const { data: activeCohort } = await supabase
      .from('cohorts')
      .select('id')
      .in('status', ['open', 'completed'])
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!activeCohort) return [];

    const { data, error } = await supabase
      .from('workshop_engagement')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('cohort_id', activeCohort.id)
      .eq('kind', 'bookmark')
      .eq('source', itemType);

    if (error) {
      console.error(`Error fetching ${itemType} bookmarks:`, error);
      return [];
    }

    // Map to match old bookmark format
    return (data || []).map(eng => ({
      id: eng.id,
      item_id: eng.url,
      item_type: itemType,
      user_id: userId,
      status: eng.status,
      review_note: eng.review_note,
      title: eng.title
    }));
  }
  
  // For other types, use old bookmark system
  let query = supabase.from('user_bookmarks').select('*').eq('user_id', userId);
  
  if (itemType) {
    query = query.eq('item_type', itemType);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching bookmarks:', error);
    return [];
  }
  return data || [];
}
