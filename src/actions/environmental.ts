'use server';

import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

// USER ACTIONS
export async function getEnvironmentalCatalog() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('environmental_catalog').select('*').not('slug', 'ilike', 'draft___%').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching catalog:', error);
    return [];
  }
  return data || [];
}

/**
 * Submit a resource suggestion.
 * If the user is logged in (submitter_profile_id provided), immediately creates a
 * PENDING workshop_engagement record so it shows in their profile right away.
 */
export async function submitSuggestion(suggestion: {
  theme_id: string;
  title: string;
  description: string;
  url: string;
  submitter_name?: string;
  submitter_profile_id?: string;
}) {
  console.log('[submitSuggestion] Called with:', suggestion);
  const supabase = createServerSupabaseClient();

  // Insert the suggestion (without submitter_profile_id column — not needed in DB)
  const { data: insertedSug, error } = await supabase
    .from('environmental_suggestions')
    .insert([{
      theme_id: suggestion.theme_id,
      title: suggestion.title,
      description: suggestion.description,
      url: suggestion.url,
      submitter_name: suggestion.submitter_name || '',
    }])
    .select()
    .single();

  if (error) {
    console.error('[submitSuggestion] Error inserting into environmental_suggestions:', error);
    return { success: false, error: error.message };
  }
  console.log('[submitSuggestion] Successfully inserted suggestion:', insertedSug.id);

  // If the user is logged in, create a PENDING engagement record immediately
  // so they can see their submission in the profile right away
  if (suggestion.submitter_profile_id && insertedSug) {
    const profileId = suggestion.submitter_profile_id;
    console.log('[submitSuggestion] Profile ID provided:', profileId, 'Attempting to create pending engagement.');

    // Find the user's most recent cohort for the required FK
    const { data: anyReg } = await supabase
      .from('workshop_registrations')
      .select('cohort_id')
      .eq('profile_id', profileId)
      .eq('status', 'registered')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let cohortId = anyReg?.cohort_id;
    console.log('[submitSuggestion] Found cohortId from registrations:', cohortId);

    if (!cohortId) {
      // Fallback: use the most recent cohort in the system
      const { data: anyCohort } = await supabase
        .from('cohorts')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      cohortId = anyCohort?.id;
      console.log('[submitSuggestion] Fallback cohortId:', cohortId);
    }

    if (cohortId) {
      console.log('[submitSuggestion] Inserting pending engagement...');
      const { data: engRecord, error: engError } = await supabase
        .from('workshop_engagement')
        .insert({
          cohort_id: cohortId,
          profile_id: profileId,
          kind: 'env_suggestion',
          title: suggestion.title,
          source: 'Environmental Literacy',
          url: suggestion.url || '',
          // Store the suggestion id so we can update this record on approval/dismiss
          content: JSON.stringify({
            suggestion_id: insertedSug.id,
            theme_id: suggestion.theme_id,
            description: suggestion.description,
          }),
          status: 'pending',
        })
        .select()
        .single();

      if (engError) {
        console.error('[submitSuggestion] Failed to create pending engagement for suggestion:', engError);
        // Non-fatal — suggestion still saved successfully
      } else if (engRecord) {
        console.log('[submitSuggestion] Successfully created pending engagement:', engRecord.id);
        // Store the engagement_id back into the suggestion so approveSuggestion can update it
        const { error: updError } = await supabase
          .from('environmental_suggestions')
          .update({ submitter_engagement_id: engRecord.id })
          .eq('id', insertedSug.id);
          
        if (updError) {
          console.error('[submitSuggestion] Failed to update suggestion with engagement ID:', updError);
        } else {
          console.log('[submitSuggestion] Successfully linked engagement ID to suggestion.');
        }
      }
    } else {
      console.warn('[submitSuggestion] No cohortId found at all, cannot insert engagement.');
    }
  } else {
    console.log('[submitSuggestion] Skipping engagement creation. profileId:', suggestion.submitter_profile_id, 'insertedSug:', !!insertedSug);
  }

  console.log('[submitSuggestion] Finished successfully.');
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
    supabase.from('environmental_catalog').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
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
  
  const { data: categoryByLabel } = await supabase
    .from('content_categories')
    .select('id, label, slug')
    .ilike('label', categoryName)
    .limit(1)
    .maybeSingle();
  
  if (categoryByLabel) {
    categoryId = categoryByLabel.id;
  } else {
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

  // 4. Update the pending engagement record to APPROVED (gives user +2%)
  // Try by submitter_engagement_id first, fall back to matching by content->suggestion_id
  if (sug.submitter_engagement_id) {
    const { data: engData } = await supabase.from('workshop_engagement').select('profile_id').eq('id', sug.submitter_engagement_id).single();
    if (engData?.profile_id) {
      await supabase.from('helpdesk_notifications').insert({
        user_id: engData.profile_id,
        title: 'Suggestion Approved',
        message: `Your suggestion "${sug.title}" has been approved and added!`,
        is_read: false
      });
    }

    // Direct update using the stored engagement id
    const { error: engUpdateError } = await supabase
      .from('workshop_engagement')
      .update({ 
        status: 'approved',
        content: JSON.stringify({
          suggestion_id: sug.id,
          theme_id: sug.theme_id,
          description: sug.description,
          library_item_id: newItem?.id
        })
      })
      .eq('id', sug.submitter_engagement_id)
      .eq('kind', 'env_suggestion');

    if (engUpdateError) {
      console.error('Failed to update engagement to approved:', engUpdateError);
    }
  } else {
    // Fallback: find pending env_suggestion engagements that reference this suggestion by title
    // (for suggestions submitted before this feature was fully deployed)
    const { data: pendingEngs } = await supabase
      .from('workshop_engagement')
      .select('id')
      .eq('kind', 'env_suggestion')
      .eq('title', sug.title)
      .eq('status', 'pending');

    if (pendingEngs && pendingEngs.length > 0) {
      await supabase
        .from('workshop_engagement')
        .update({ 
          status: 'approved',
          content: JSON.stringify({
            suggestion_id: sug.id,
            theme_id: sug.theme_id,
            description: sug.description,
            library_item_id: newItem?.id
          })
        })
        .in('id', pendingEngs.map((e: any) => e.id));
    }
  }

  // 5. Delete the suggestion
  const { error: delError } = await supabase.from('environmental_suggestions').delete().eq('id', sug.id);
  if (delError) return { success: false, error: delError.message };
  
  return { success: true };
}

export async function dismissSuggestion(id: string) {
  const supabase = createServerSupabaseClient();

  // First, fetch the suggestion to get its submitter_engagement_id (if any)
  const { data: sug } = await supabase
    .from('environmental_suggestions')
    .select('submitter_engagement_id, title')
    .eq('id', id)
    .maybeSingle();

  // If there's a linked pending engagement, delete it (no credit since dismissed)
  if (sug?.submitter_engagement_id) {
    const { data: engData } = await supabase.from('workshop_engagement').select('profile_id').eq('id', sug.submitter_engagement_id).single();
    if (engData?.profile_id) {
      await supabase.from('helpdesk_notifications').insert({
        user_id: engData.profile_id,
        title: 'Suggestion Reviewed',
        message: `Your suggestion "${sug.title}" was reviewed but not added at this time.`,
        is_read: false
      });
    }

    await supabase
      .from('workshop_engagement')
      .delete()
      .eq('id', sug.submitter_engagement_id)
      .eq('kind', 'env_suggestion')
      .eq('status', 'pending');
  }

  // Delete the suggestion
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

export async function updateCatalogOrder(items: { id: string; sort_order: number }[]) {
  const supabase = createServerSupabaseClient();
  const updates = items.map(item =>
    supabase.from('environmental_catalog').update({ sort_order: item.sort_order }).eq('id', item.id)
  );
  await Promise.all(updates);
  return { success: true };
}
