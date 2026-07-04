'use server';

import { createServerSupabaseClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function submitReflection(payload: any) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase.from('public_submissions').insert({
    ...payload,
    clerk_user_id: userId,
    status: 'new'
  });

  if (error) {
    throw error;
  }

  revalidatePath('/admin/community-listening', 'layout');
  
  return { success: true };
}
