'use server';

import { createServerSupabaseClient } from '@/utils/supabase/server';

// USER ACTIONS
export async function getEnvironmentalCatalog() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('environmental_catalog').select('*').not('slug', 'ilike', 'draft___%');
  if (error) {
    console.error('Error fetching catalog:', error);
    return [];
  }
  return data || [];
}

export async function submitSuggestion(suggestion: { theme_id: string, title: string, description: string, url: string, submitter_name?: string }) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('environmental_suggestions').insert([suggestion]);
  if (error) {
    console.error('Error submitting suggestion:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ADMIN ACTIONS
export async function getAdminEnvironmentalData() {
  const supabase = createServerSupabaseClient();
  const [catRes, sugRes, srcRes] = await Promise.all([
    supabase.from('environmental_catalog').select('*').order('created_at', { ascending: false }),
    supabase.from('environmental_suggestions').select('*').order('created_at', { ascending: false }),
    supabase.from('environmental_sources').select('*').order('created_at', { ascending: false })
  ]);
  
  return {
    catalog: catRes.data || [],
    suggestions: sugRes.data || [],
    sources: srcRes.data || []
  };
}

export async function deleteCatalogEntry(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('environmental_catalog').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function approveSuggestion(sug: any) {
  const supabase = createServerSupabaseClient();
  const { error: insertError } = await supabase.from('environmental_sources').insert([
    { theme_id: sug.theme_id, label: sug.title, url: sug.url, item_description: sug.description }
  ]);
  
  if (insertError) return { success: false, error: insertError.message };

  const { error: delError } = await supabase.from('environmental_suggestions').delete().eq('id', sug.id);
  if (delError) return { success: false, error: delError.message };
  
  return { success: true };
}

export async function dismissSuggestion(id: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('environmental_suggestions').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateCatalogEntry(id: string, updates: any) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('environmental_catalog').update(updates).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function insertCatalogEntry(entry: any) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from('environmental_catalog').insert([entry]);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
