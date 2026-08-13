'use server';

import { createClient } from '@supabase/supabase-js';

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const sb = createClient(supabaseUrl, supabaseKey);

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
  const filePath = `workforce/${filename}`;

  const { error: uploadError } = await sb.storage
    .from('content-uploads')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data: urlData } = sb.storage
    .from('content-uploads')
    .getPublicUrl(filePath);

  return { url: urlData.publicUrl };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchWorkforceCounts() {
  let creatorCount = 0;
  let enviroCount = 0;
  let pendingCount = 0;
  const stopCounts: Record<string, number> = {};

  // Run all queries in parallel instead of sequentially
  const [entryCounts, jobsResult, externalBoardsResult, sourcesResult, quizzesResult] = await Promise.all([
    supabase.from('workforce_entries').select('pathway_id, stop_id, status'),
    supabase.from('workforce_jobs').select('*', { count: 'exact', head: true }),
    supabase.from('workforce_external_boards').select('*', { count: 'exact', head: true }),
    supabase.from('content_items').select('*', { count: 'exact', head: true }).eq('category_id', 'f4fc9a34-ce7f-4e1c-a360-f28d8a55becc').in('topic_id', ['16acc180-063d-4d14-a789-94eccd836569', 'c332e4ed-5717-415e-850e-8da417081902']).eq('status', 'published'),
    supabase.from('workforce_quizzes').select('*', { count: 'exact', head: true })
  ]);

  if (entryCounts.data) {
    entryCounts.data.forEach(row => {
      if (row.status === 'pending') {
        pendingCount++;
      } else if (row.status === 'published') {
        if (row.pathway_id === 'creator') creatorCount++;
        if (row.pathway_id === 'enviro') enviroCount++;
        // Key by "pathwayId:stopId" so counts are NOT mixed across pathways
        const key = `${row.pathway_id}:${row.stop_id}`;
        stopCounts[key] = (stopCounts[key] || 0) + 1;
      }
    });
  }

  return {
    creatorCount,
    enviroCount,
    jobsCount: jobsResult.count || 0,
    externalBoardsCount: externalBoardsResult.count || 0,
    pendingCount,
    sourcesCount: sourcesResult.count || 0,
    quizzesCount: quizzesResult.count || 0,
    stopCounts
  };
}

export async function fetchPublishedEntries(pathwayId: string, stopId: string) {
  const { data } = await supabase
    .from('workforce_entries')
    .select('*')
    .eq('pathway_id', pathwayId)
    .eq('stop_id', stopId)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return data || [];
}

export async function fetchWorkforceStructure() {
  const { data: pathways } = await supabase
    .from('workforce_pathways')
    .select('*');
    
  const { data: stops } = await supabase
    .from('workforce_stops')
    .select('*');
    
  return { pathways: pathways || [], stops: stops || [] };
}

export async function updateWorkforceMeta(type: 'pathway' | 'stop', id: string, text: string) {
  if (type === 'pathway') {
    const { error } = await supabase
      .from('workforce_pathways')
      .update({ intro: text })
      .eq('id', id);
    if (error) throw error;
  } else if (type === 'stop') {
    const { error } = await supabase
      .from('workforce_stops')
      .update({ blurb: text })
      .eq('id', id);
    if (error) throw error;
  }
}

export async function upsertWorkforceEntry(entry: any) {
  const isRealUUID = typeof entry.id === 'string' && entry.id.length === 36 && entry.id.includes('-');
  if (entry.id && isRealUUID) {
    const { data, error } = await supabase
      .from('workforce_entries')
      .update({
        title: entry.title,
        subtitle: entry.subtitle,
        call_no: entry.call_no,
        type: entry.type,
        body_html: entry.body_html,
        media_fallback: entry.media_fallback,
        images: entry.images || [],
        facts: entry.facts || [],
        sources: entry.sources || [],
        status: entry.status || 'published'
      })
      .eq('id', entry.id)
      .select()
      .single();
    if (error) throw error;

    // Check if this was a pending suggestion with an engagement ID attached
    if (data && data.submitter_engagement_id && data.status === 'published') {
      // Approve the engagement to grant points
      await supabase
        .from('workshop_engagement')
        .update({ 
          status: 'approved',
          content: JSON.stringify({
            suggestion_id: data.id,
            title: data.title,
            type: data.type,
            library_item_id: data.id // The workforce entry is its own library item
          })
        })
        .eq('id', data.submitter_engagement_id)
        .eq('kind', 'wf_suggestion');
    }

    return data;
  } else {
    const { data, error } = await supabase
      .from('workforce_entries')
      .insert({
        title: entry.title,
        subtitle: entry.subtitle,
        call_no: entry.call_no,
        type: entry.type,
        body_html: entry.body_html,
        media_fallback: entry.media_fallback,
        images: entry.images || [],
        facts: entry.facts || [],
        sources: entry.sources || [],
        pathway_id: entry.pathway_id,
        stop_id: entry.stop_id,
        status: 'published'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteWorkforceEntry(id: string) {
  // First get the entry to find its engagement ID if any
  const { data: entry } = await supabase
    .from('workforce_entries')
    .select('submitter_engagement_id, status')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('workforce_entries')
    .delete()
    .eq('id', id);
  if (error) throw error;

  // Delete the pending engagement if it was never published
  if (entry && entry.submitter_engagement_id && entry.status === 'pending') {
    await supabase
      .from('workshop_engagement')
      .delete()
      .eq('id', entry.submitter_engagement_id);
  }
}

export async function fetchWorkforceJobs() {
  const { data } = await supabase
    .from('workforce_jobs')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function upsertWorkforceJob(job: any) {
  if (job.id) {
    const { data, error } = await supabase
      .from('workforce_jobs')
      .update({
        pathway_id: job.pathway_id,
        title: job.title,
        organization: job.organization,
        location: job.location,
        job_type: job.job_type,
        apply_url: job.apply_url
      })
      .eq('id', job.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('workforce_jobs')
      .insert({
        pathway_id: job.pathway_id,
        title: job.title,
        organization: job.organization,
        location: job.location,
        job_type: job.job_type,
        apply_url: job.apply_url
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteWorkforceJob(id: string) {
  const { error } = await supabase
    .from('workforce_jobs')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function submitSuggestion(suggestion: any) {
  console.log('[Workforce submitSuggestion] Called with:', suggestion);
  
  const { data: insertedSug, error } = await supabase
    .from('workforce_entries')
    .insert({
      title: suggestion.title,
      type: suggestion.type,
      pathway_id: suggestion.pathway_id,
      stop_id: suggestion.stop_id,
      body_html: suggestion.note,
      sources: suggestion.url ? [['Link', suggestion.url]] : [],
      status: 'pending',
      subtitle: suggestion.contributor || 'anonymous'
    })
    .select()
    .single();
    
  if (error) throw error;
  console.log('[Workforce submitSuggestion] Successfully inserted entry:', insertedSug.id);

  // If the user is logged in, create a PENDING engagement record
  if (suggestion.submitter_profile_id && insertedSug) {
    const profileId = suggestion.submitter_profile_id;
    console.log('[Workforce submitSuggestion] Creating pending engagement for profile:', profileId);

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
    
    if (!cohortId) {
      // Fallback
      const { data: anyCohort } = await supabase
        .from('cohorts')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      cohortId = anyCohort?.id;
    }

    if (cohortId) {
      const { data: engRecord, error: engError } = await supabase
        .from('workshop_engagement')
        .insert({
          cohort_id: cohortId,
          profile_id: profileId,
          kind: 'wf_suggestion',
          title: suggestion.title,
          source: 'Workforce Pathways',
          url: suggestion.url || '',
          content: JSON.stringify({
            suggestion_id: insertedSug.id,
            pathway_id: suggestion.pathway_id,
            stop_id: suggestion.stop_id,
            type: suggestion.type
          }),
          status: 'pending',
        })
        .select()
        .single();

      if (engError) {
        console.error('[Workforce submitSuggestion] Failed to create pending engagement:', engError);
      } else if (engRecord) {
        console.log('[Workforce submitSuggestion] Linked engagement ID:', engRecord.id);
        await supabase
          .from('workforce_entries')
          .update({ submitter_engagement_id: engRecord.id })
          .eq('id', insertedSug.id);
      }
    }
  }

  return insertedSug;
}

export async function fetchPendingSuggestions() {
  const { data } = await supabase
    .from('workforce_entries')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  return data || [];
}

export async function updateSuggestion(id: string, updates: any) {
  const { error } = await supabase
    .from('workforce_entries')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function approveSuggestion(id: string) {
  // 1. Get the pending entry to read its pathway_id and data
  const { data: entry, error: fetchErr } = await supabase
    .from('workforce_entries')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr || !entry) throw fetchErr || new Error('Entry not found');

  // 2. Map pathway_id to topic_id
  let topicId = null;
  if (entry.pathway_id === 'creator') topicId = '16acc180-063d-4d14-a789-94eccd836569';
  else if (entry.pathway_id === 'enviro') topicId = 'c332e4ed-5717-415e-850e-8da417081902';

  // 3. Clone into content_items (so it goes live in the Steward Library)
  const { data: newItem, error: insertErr } = await supabase
    .from('content_items')
    .insert({
      content_type: 'library_resource',
      title: entry.title,
      body: entry.body_html || entry.subtitle || '',
      category_id: 'f4fc9a34-ce7f-4e1c-a360-f28d8a55becc', // AI Industry & Work
      topic_id: topicId,
      status: 'published',
      resource_type: entry.type ? entry.type.toLowerCase() : 'article'
    })
    .select()
    .single();
  
  if (insertErr) throw insertErr;

  // 4. If it has a URL, insert into content_media
  if (entry.sources && entry.sources.length > 0) {
    const url = entry.sources[0][1];
    await supabase.from('content_media').insert({
      content_item_id: newItem.id,
      media_type: 'external_link',
      url: url,
      label: 'Source Link'
    });
  }

  // 5. Update the engagement to APPROVED before deleting the entry
  if (entry.submitter_engagement_id) {
    const { data: engData } = await supabase.from('workshop_engagement').select('profile_id').eq('id', entry.submitter_engagement_id).single();
    if (engData?.profile_id) {
      await supabase.from('helpdesk_notifications').insert({
        user_id: engData.profile_id,
        title: 'Suggestion Approved',
        message: `Your suggestion "${entry.title}" has been approved and added!`,
        is_read: false
      });
    }

    await supabase
      .from('workshop_engagement')
      .update({ 
        status: 'approved',
        content: JSON.stringify({
          suggestion_id: entry.id,
          title: entry.title,
          type: entry.type,
          library_item_id: newItem.id
        })
      })
      .eq('id', entry.submitter_engagement_id)
      .eq('kind', 'wf_suggestion');
  }

  // 6. Delete the pending entry from workforce_entries (as requested, it should ONLY go to Steward Library)
  const { error } = await supabase
    .from('workforce_entries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function dismissSuggestion(id: string) {
  // Find the entry first to get the engagement ID
  const { data: entry } = await supabase
    .from('workforce_entries')
    .select('submitter_engagement_id')
    .eq('id', id)
    .single();

  if (entry && entry.submitter_engagement_id) {
    const { data: engData } = await supabase.from('workshop_engagement').select('profile_id').eq('id', entry.submitter_engagement_id).single();
    if (engData?.profile_id) {
      await supabase.from('helpdesk_notifications').insert({
        user_id: engData.profile_id,
        title: 'Suggestion Reviewed',
        message: `Your suggestion was reviewed but not added at this time.`,
        is_read: false
      });
    }

    // Delete the engagement or set it to rejected
    await supabase
      .from('workshop_engagement')
      .update({ status: 'rejected' })
      .eq('id', entry.submitter_engagement_id);
  }

  const { error } = await supabase
    .from('workforce_entries')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function fetchAllPublishedSources() {
  const { data } = await supabase
    .from('content_items')
    .select(`
      *,
      media:content_media(*),
      topic:env_literacy_topics(*)
    `)
    .eq('category_id', 'f4fc9a34-ce7f-4e1c-a360-f28d8a55becc')
    .in('topic_id', ['16acc180-063d-4d14-a789-94eccd836569', 'c332e4ed-5717-415e-850e-8da417081902'])
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getArcadeAvatar(userId: string) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_avatars')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    console.error('Error fetching avatar:', error);
    return null;
  }
  return data;
}

export async function saveArcadeAvatar(userId: string, avatarData: any) {
  if (!userId) return { error: 'No user ID' };
  
  const payload = {
    user_id: userId,
    form: avatarData.form,
    skin: avatarData.skin,
    outfit: avatarData.outfit,
    hair_style: avatarData.hairStyle,
    hair_color: avatarData.hairColor,
    hat_type: avatarData.hatType,
    hat_color: avatarData.hatColor,
    gear: avatarData.gear,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('user_avatars')
    .upsert(payload)
    .select()
    .single();
    
  if (error) {
    console.error('Error saving avatar:', error);
    return { error: error.message };
  }
  
  return { data };
}

export async function fetchExternalBoards() {
  const { data } = await supabase
    .from('workforce_external_boards')
    .select('*')
    .order('created_at', { ascending: true });
  return data || [];
}

export async function upsertExternalBoard(board: any) {
  if (board.id) {
    const { data, error } = await supabase
      .from('workforce_external_boards')
      .update({
        pathway_id: board.pathway_id,
        label: board.label,
        url: board.url,
        description: board.description
      })
      .eq('id', board.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('workforce_external_boards')
      .insert({
        pathway_id: board.pathway_id,
        label: board.label,
        url: board.url,
        description: board.description
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteExternalBoard(id: string) {
  const { error } = await supabase
    .from('workforce_external_boards')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

export async function fetchAllWorkforceEntries() {
  const { data, error } = await supabase
    .from('workforce_entries')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchAllWorkforceEntries error:', error); return []; }
  return data || [];
}

export async function fetchAllQuizzes() {
  const { data, error } = await supabase.from('workforce_quizzes').select('*');
  if (error) { console.error('fetchAllQuizzes error:', error); return []; }
  return data || [];
}

export async function saveQuiz(quiz: any) {
  const { pathway_id, stop_id, prompt, pick, result, allow_custom, custom_label, optional, options } = quiz;

  // Since pick, result, and custom_label are missing from the Supabase schema,
  // we safely pack them into the JSON options array to avoid database errors.
  const metaOption = { id: '__meta__', pick, result, custom_label };
  const mergedOptions = [metaOption, ...(options || []).filter((o: any) => o.id !== '__meta__')];

  const { data: existing } = await supabase.from('workforce_quizzes')
    .select('id').eq('pathway_id', pathway_id).eq('stop_id', stop_id).maybeSingle();

  if (existing) {
    const { data, error } = await supabase.from('workforce_quizzes')
      .update({ prompt, allow_custom, optional, options: mergedOptions })
      .eq('id', existing.id).select().single();
    if (error) { console.error('saveQuiz update error:', error); return { error }; }
    return data;
  } else {
    const { data, error } = await supabase.from('workforce_quizzes')
      .insert({ pathway_id, stop_id, prompt, allow_custom, optional, options: mergedOptions })
      .select().single();
    if (error) { console.error('saveQuiz insert error:', error); return { error }; }
    return data;
  }
}

export async function fetchAllSummits() {
  const { data, error } = await supabase.from('workforce_summits').select('*');
  if (error) { console.error('fetchAllSummits error:', error); return []; }
  return data || [];
}

export async function saveSummit(summit: any) {
  const { pathway_id, title, klass, intro, closer } = summit;
  
  const { data: existing } = await supabase.from('workforce_summits')
    .select('id').eq('pathway_id', pathway_id).maybeSingle();

  if (existing) {
    const { data, error } = await supabase.from('workforce_summits')
      .update({ title, klass, intro, closer })
      .eq('id', existing.id).select().single();
    if (error) { console.error('saveSummit update error:', error); return { error }; }
    return data;
  } else {
    const { data, error } = await supabase.from('workforce_summits')
      .insert({ pathway_id, title, klass, intro, closer })
      .select().single();
    if (error) { console.error('saveSummit insert error:', error); return { error }; }
    return data;
  }
}

export async function fetchUserPicks(userId: string) {
  const { data, error } = await supabase.from('workforce_user_picks')
    .select('*').eq('user_id', userId);
  if (error) { console.error('fetchUserPicks error:', error); return []; }
  return data || [];
}

export async function saveUserPick(pick: any) {
  const { user_id, pathway_id, stop_id, option_id, custom_answer } = pick;
  
  const { data: existing } = await supabase.from('workforce_user_picks')
    .select('id').eq('user_id', user_id).eq('pathway_id', pathway_id).eq('stop_id', stop_id).maybeSingle();

  if (existing) {
    const { data, error } = await supabase.from('workforce_user_picks')
      .update({ option_id, custom_answer })
      .eq('id', existing.id).select().single();
    if (error) { console.error('saveUserPick update error:', error); return { error }; }
    return data;
  } else {
    const { data, error } = await supabase.from('workforce_user_picks')
      .insert({ user_id, pathway_id, stop_id, option_id, custom_answer })
      .select().single();
    if (error) { console.error('saveUserPick insert error:', error); return { error }; }
    return data;
  }
}

export async function fetchWorkforceInitialData() {
  const [
    structure,
    counts,
    jobs,
    boards,
    entries,
    quizzes,
    summits
  ] = await Promise.all([
    fetchWorkforceStructure(),
    fetchWorkforceCounts(),
    fetchWorkforceJobs(),
    fetchExternalBoards(),
    fetchAllWorkforceEntries(),
    fetchAllQuizzes(),
    fetchAllSummits()
  ]);

  return { structure, counts, jobs, boards, entries, quizzes, summits };
}

export async function updateWorkforceEntryOrder(items: { id: string; sort_order: number }[]) {
  const updates = items.map(item => supabase.from('workforce_entries').update({ sort_order: item.sort_order }).eq('id', item.id));
  await Promise.all(updates);
  return { success: true };
}

// ─── Quest Board Job Suggestions ────────────────────────────────────────────

export async function submitJobSuggestion(data: {
  title: string;
  apply_url: string;
  contributor_name: string;
  pathway_id: string;
  job_type: string;
  organization?: string;
  location?: string;
  note?: string;
  submitter_profile_id?: string;
}) {
  const insertData: any = {
    title: data.title,
    apply_url: data.apply_url || '',
    contributor_name: data.contributor_name || 'anonymous',
    pathway_id: data.pathway_id || 'creator',
    job_type: data.job_type || 'Full-time',
    status: 'pending'
  };
  
  if (data.organization) insertData.organization = data.organization;
  if (data.location) insertData.location = data.location;
  if (data.note) insertData.note = data.note;

  const { data: row, error } = await supabase
    .from('workforce_job_suggestions')
    .insert(insertData)
    .select()
    .single();
  if (error) {
    try {
      const fs = require('fs');
      fs.appendFileSync('C:/projects/education/db_err.txt', JSON.stringify(error) + '\\n');
    } catch(e) {}
    throw error;
  }
  
  console.log('[Workforce submitJobSuggestion] received submitter_profile_id:', data.submitter_profile_id);
  
  if (data.submitter_profile_id && row) {
    const profileId = data.submitter_profile_id;
    const { data: anyReg } = await supabase
      .from('workshop_registrations')
      .select('cohort_id')
      .eq('profile_id', profileId)
      .eq('status', 'registered')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let cohortId = anyReg?.cohort_id;
    
    if (!cohortId) {
      const { data: anyCohort } = await supabase
        .from('cohorts')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      cohortId = anyCohort?.id;
    }
    
    console.log('[Workforce submitJobSuggestion] resolved cohortId:', cohortId);

    if (cohortId) {
      const { error: engErr } = await supabase
        .from('workshop_engagement')
        .insert({
          cohort_id: cohortId,
          profile_id: profileId,
          kind: 'wf_suggestion',
          title: data.title,
          source: 'Workforce Pathways',
          url: data.apply_url || '',
          content: JSON.stringify({
            suggestion_id: row.id,
            pathway_id: data.pathway_id,
            job_type: data.job_type,
            type: 'job_quest'
          }),
          status: 'pending',
        });
        
      if (engErr) {
        console.error('[Workforce submitJobSuggestion] failed to insert engagement:', engErr);
      } else {
        console.log('[Workforce submitJobSuggestion] successfully created engagement');
      }
    }
  } else {
    console.log('[Workforce submitJobSuggestion] Skipping engagement creation because submitter_profile_id is missing or row is null');
  }
  
  return row;
}

export async function fetchJobSuggestions() {
  const { data } = await supabase
    .from('workforce_job_suggestions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  return data || [];
}

export async function fetchJobSuggestionsCount() {
  const { count } = await supabase
    .from('workforce_job_suggestions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  return count || 0;
}

export async function updateJobSuggestion(id: string, updates: {
  title?: string;
  apply_url?: string;
  contributor_name?: string;
  pathway_id?: string;
  job_type?: string;
  organization?: string;
  location?: string;
  note?: string;
}) {
  const { error } = await supabase
    .from('workforce_job_suggestions')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function approveJobSuggestion(id: string) {
  // Get the suggestion
  const { data: sug, error: fetchErr } = await supabase
    .from('workforce_job_suggestions')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr || !sug) throw fetchErr || new Error('Suggestion not found');

  // Insert into workforce_jobs
  const { error: insertErr } = await supabase
    .from('workforce_jobs')
    .insert({
      title: sug.title,
      apply_url: sug.apply_url,
      pathway_id: sug.pathway_id || 'creator',
      job_type: sug.job_type || 'Full-time',
      organization: sug.organization || '',
      location: sug.location || ''
    });
  if (insertErr) {
    console.error("Error inserting into workforce_jobs:", insertErr);
    throw insertErr;
  }

  // Mark suggestion as approved
  const { error: updErr } = await supabase
    .from('workforce_job_suggestions')
    .update({ status: 'approved' })
    .eq('id', id);
  if (updErr) throw updErr;

  // Find the pending engagement record and reward the user
  const { data: engRecords } = await supabase
    .from('workshop_engagement')
    .select('*')
    .eq('kind', 'wf_suggestion')
    .eq('status', 'pending');
    
  const pendingEng = engRecords?.find(r => {
    try {
      const content = typeof r.content === 'string' ? JSON.parse(r.content) : r.content;
      return content?.suggestion_id === id;
    } catch(e) { return false; }
  });

  if (pendingEng) {
    // 1. Update workshop_engagement to approved (no points_awarded column)
    const { error: updEngErr } = await supabase
      .from('workshop_engagement')
      .update({ status: 'approved' })
      .eq('id', pendingEng.id);
      
    if (updEngErr) console.error("Error updating workshop_engagement:", updEngErr);
    
    // 2. Insert the 2% points into engagement_entries
    if (pendingEng.profile_id && pendingEng.cohort_id) {
      const { error: engErr } = await supabase
        .from('engagement_entries')
        .insert({
          profile_id: pendingEng.profile_id,
          cohort_id: pendingEng.cohort_id,
          kind: 'job_quest_suggestion',
          points: 2,
          description: `Approved job suggestion: ${sug.title}`
        });
      if (engErr) console.error("Error creating engagement entry:", engErr);
    }
    
    // 3. Notify the user
    if (pendingEng.profile_id) {
      await supabase.from('helpdesk_notifications').insert({
        user_id: pendingEng.profile_id,
        title: 'Job Suggestion Approved',
        message: `Your job suggestion "${sug.title}" has been approved and added to the Quest Board!`,
        is_read: false
      });
    }
  }
}

export async function rejectJobSuggestion(id: string) {
  const { error } = await supabase
    .from('workforce_job_suggestions')
    .update({ status: 'rejected' })
    .eq('id', id);
  if (error) throw error;
}
