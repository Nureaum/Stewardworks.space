'use server';

import { createServerSupabaseClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

// ==============================
// ANNOUNCEMENTS
// ==============================

export async function createAnnouncement(title: string, body: string) {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  
  if (!userId) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('hub_announcements')
    .insert({ title, body })
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/announcements');
  revalidatePath('/hub');
  return data;
}

export async function getAnnouncements() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('hub_announcements')
    .select('*, announcement_reads(count)')
    .order('created_at', { ascending: false });

  if (error) return [];
  
  return data.map(announcement => ({
    ...announcement,
    reads: announcement.announcement_reads?.[0]?.count || 0
  }));
}

export async function markAnnouncementAsRead(announcementId: string) {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  
  if (!userId) return;

  const { error } = await supabase
    .from('announcement_reads')
    .insert({ announcement_id: announcementId, user_id: userId });

  if (!error) {
    revalidatePath('/hub');
  }
}

export async function getUnreadAnnouncements() {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  
  if (!userId) return [];

  // Get all announcements
  const { data: allAnnouncements } = await supabase
    .from('hub_announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (!allAnnouncements?.length) return [];

  // Get user's read announcements
  const { data: userReads } = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('user_id', userId);

  const readIds = new Set(userReads?.map(r => r.announcement_id) || []);
  
  // Return announcements the user hasn't read yet
  return allAnnouncements.filter(a => !readIds.has(a.id));
}

// ==============================
// SYSTEM BULLETINS
// ==============================

export async function getSystemBulletins() {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('system_bulletins')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    // If it doesn't exist, we might just return empty strings
    return {
      project_bulletin_text: '',
      onboarding_headline: '',
      onboarding_body: '',
      onboarding_cta_label: '',
      onboarding_cta_url: '',
      onboarding_image_url: ''
    };
  }
  
  return data;
}

export async function updateProjectBulletin(text: string) {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('system_bulletins')
    .upsert({ id: 1, project_bulletin_text: text, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/announcements');
  revalidatePath('/hub');
}

export async function updateOnboardingBulletin(data: {
  headline: string;
  body: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
}) {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('system_bulletins')
    .upsert({
      id: 1,
      onboarding_headline: data.headline,
      onboarding_body: data.body,
      onboarding_cta_label: data.cta_label,
      onboarding_cta_url: data.cta_url,
      onboarding_image_url: data.image_url,
      updated_at: new Date().toISOString()
    });

  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/announcements');
  revalidatePath('/onboarding/bulletin');
}

export async function getBulletinUpdates() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('bulletin_updates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

export async function getBulletinEvents() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('bulletin_events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

export async function createBulletinUpdate(data: { tag: string; title: string; body: string; detail: string; cta_label: string }) {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { error } = await supabase.from('bulletin_updates').insert(data);
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/announcements');
  revalidatePath('/onboarding/bulletin');
}

export async function deleteBulletinUpdate(id: string) {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { error } = await supabase.from('bulletin_updates').delete().eq('id', id);
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/announcements');
  revalidatePath('/onboarding/bulletin');
}

export async function createBulletinEvent(data: { badge: string; title: string; event_date: string; event_time: string; location: string; image_url?: string | null }) {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { error } = await supabase.from('bulletin_events').insert(data);
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/announcements');
  revalidatePath('/onboarding/bulletin');
}

export async function deleteBulletinEvent(id: string) {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { error } = await supabase.from('bulletin_events').delete().eq('id', id);
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/announcements');
  revalidatePath('/onboarding/bulletin');
}

export async function updateBulletinUpdate(id: string, data: { tag: string; title: string; body: string; detail: string; cta_label: string }) {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { error } = await supabase.from('bulletin_updates').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/announcements');
  revalidatePath('/onboarding/bulletin');
}

export async function updateBulletinEvent(id: string, data: { badge: string; title: string; event_date: string; event_time: string; location: string; image_url?: string | null }) {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { error } = await supabase.from('bulletin_events').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/announcements');
  revalidatePath('/onboarding/bulletin');
}
