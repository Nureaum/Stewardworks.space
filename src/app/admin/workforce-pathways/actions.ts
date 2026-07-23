'use server';

import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
  const filepath = path.join(process.cwd(), 'public/uploads', filename);

  await writeFile(filepath, buffer);
  
  return { url: `/uploads/${filename}` };
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
    supabase.from('workforce_entries').select('*', { count: 'exact', head: true }).not('sources', 'is', null).neq('sources', '[]'),
    supabase.from('workforce_quizzes').select('*', { count: 'exact', head: true })
  ]);

  if (entryCounts.data) {
    entryCounts.data.forEach(row => {
      if (row.status === 'pending') {
        pendingCount++;
      } else if (row.status === 'published' || !row.status) {
        if (row.pathway_id === 'creator') creatorCount++;
        if (row.pathway_id === 'enviro') enviroCount++;
        stopCounts[row.stop_id] = (stopCounts[row.stop_id] || 0) + 1;
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
      })
      .eq('id', entry.id)
      .select()
      .single();
    if (error) throw error;
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
  const { error } = await supabase
    .from('workforce_entries')
    .delete()
    .eq('id', id);
  if (error) throw error;
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
  const { data, error } = await supabase
    .from('workforce_entries')
    .insert({
      title: suggestion.title,
      type: suggestion.type,
      pathway_id: suggestion.pathway_id,
      stop_id: suggestion.stop_id,
      body_html: suggestion.note,
      sources: suggestion.url ? [['Link', suggestion.url]] : [],
      status: 'pending'
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPendingSuggestions() {
  const { data } = await supabase
    .from('workforce_entries')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  return data || [];
}

export async function approveSuggestion(id: string) {
  // 1. Get the pending entry to read its pathway_id and data
  const { data: entry, error: fetchErr } = await supabase
    .from('workforce_entries')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr || !entry) throw fetchErr || new Error('Entry not found');

  // 2. Delete the pending entry from workforce_entries (as requested, it should ONLY go to Steward Library)
  const { error } = await supabase
    .from('workforce_entries')
    .delete()
    .eq('id', id);
  if (error) throw error;

  // 3. Map pathway_id to topic_id
  let topicId = null;
  if (entry.pathway_id === 'creator') topicId = '16acc180-063d-4d14-a789-94eccd836569';
  else if (entry.pathway_id === 'enviro') topicId = 'c332e4ed-5717-415e-850e-8da417081902';

  // 4. Clone into content_items (so it goes live in the Steward Library)
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

  // 5. If it has a URL, insert into content_media
  if (entry.sources && entry.sources.length > 0) {
    const url = entry.sources[0][1];
    await supabase.from('content_media').insert({
      content_item_id: newItem.id,
      media_type: 'external_link',
      url: url,
      label: 'Source Link'
    });
  }
}

export async function dismissSuggestion(id: string) {
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
