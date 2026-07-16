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
  
  // Map category names to theme_ids
  const categoryToTheme: Record<string, string> = {
    'Imperial County Bioregion': 'bioregion',
    'Indigenous People of Imperial County': 'indigenous',
    'Imperial County History': 'history',
    'Imperial County & the Wider World': 'wider'
  };
  
  // Get all 4 Environmental Literacy category IDs
  const { data: elCategories } = await supabase
    .from('content_categories')
    .select('id, label')
    .or('label.ilike.Imperial County Bioregion,label.ilike.Indigenous People of Imperial County,label.ilike.Imperial County History,label.ilike.Imperial County & the Wider World');
  
  const categoryIds = (elCategories || []).map(c => c.id);
  const categoryIdToTheme: Record<string, string> = {};
  (elCategories || []).forEach(c => {
    categoryIdToTheme[c.id] = categoryToTheme[c.label] || 'bioregion';
  });
  
  // Build sources query - fetch from content_items with any of the 4 Environmental Literacy categories
  let sourcesQuery = supabase
    .from('content_items')
    .select('id, title, body, category_id, created_at, media:content_media(url)')
    .eq('content_type', 'library_resource')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  
  // Only filter by category if we have Environmental Literacy categories
  if (categoryIds.length > 0) {
    sourcesQuery = sourcesQuery.in('category_id', categoryIds);
  }
  
  const [catRes, sugRes, srcRes] = await Promise.all([
    supabase.from('environmental_catalog').select('*').order('created_at', { ascending: false }),
    supabase.from('environmental_suggestions').select('*').order('created_at', { ascending: false }),
    sourcesQuery
  ]);
  
  // Transform content_items to match the expected sources format
  const sources = (srcRes.data || []).map((item: any) => {
    // Get theme_id from category_id mapping
    const themeId = categoryIdToTheme[item.category_id] || 'bioregion';
    
    return {
      id: item.id,
      theme_id: themeId,
      label: item.title,
      url: item.media?.[0]?.url || '',
      item_description: item.body,
      created_at: item.created_at
    };
  });
  
  return {
    catalog: catRes.data || [],
    suggestions: sugRes.data || [],
    sources: sources
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
  
  // Map environmental theme_id to Library category name
  const themeToCategory: Record<string, string> = {
    'bioregion': 'Imperial County Bioregion',
    'indigenous': 'Indigenous People of Imperial County',
    'history': 'Imperial County History',
    'wider': 'Imperial County & the Wider World'
  };
  
  const categoryName = themeToCategory[sug.theme_id] || 'Imperial County Bioregion';
  
  // 1. Get or create the corresponding Environmental Literacy category
  let categoryId = null;
  
  // Try to find the category by label first
  const { data: categoryByLabel } = await supabase
    .from('content_categories')
    .select('id, label, slug')
    .ilike('label', categoryName)
    .limit(1)
    .maybeSingle();
  
  if (categoryByLabel) {
    categoryId = categoryByLabel.id;
  } else {
    // Create the category if it doesn't exist
    const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { data: newCategory, error: createCatError } = await supabase
      .from('content_categories')
      .insert({
        label: categoryName,
        slug: slug,
        icon: '🌿'
      })
      .select('id')
      .single();
    
    if (createCatError) {
      console.error('Failed to create category:', createCatError);
      return { success: false, error: 'Failed to create category' };
    }
    categoryId = newCategory?.id;
  }
  
  if (!categoryId) {
    return { success: false, error: 'Could not find or create category' };
  }
  
  // 2. Insert into content_items (Library) with the correct Environmental Literacy category
  const { data: newItem, error: insertError } = await supabase.from('content_items').insert({
    content_type: 'library_resource',
    title: sug.title,
    body: sug.description || '',
    resource_type: 'article',
    category_id: categoryId,
    status: 'published',
    published_at: new Date().toISOString()
  }).select().single();
  
  if (insertError) {
    console.error('Failed to insert library resource:', insertError);
    return { success: false, error: insertError.message };
  }

  // 3. Add the URL as content_media link
  if (newItem && sug.url) {
    const { error: mediaError } = await supabase.from('content_media').insert({
      content_item_id: newItem.id,
      media_type: 'external_link',
      url: sug.url,
      sort_order: 0
    });
    if (mediaError) {
      console.error('Failed to insert media URL:', mediaError);
    }
  }

  // 4. Delete the suggestion
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
