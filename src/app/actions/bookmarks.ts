'use server';

import { createServerSupabaseClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function toggleBookmark(itemId: string, itemType: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const supabase = createServerSupabaseClient();
  
  // Check if exists
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
