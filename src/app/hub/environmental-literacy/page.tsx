import ClientEnvPage from './ClientEnvPage';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function EnvironmentalLiteracyPage() {
  const supabase = createServerSupabaseClient();

  const { data: topics } = await supabase
    .from('env_literacy_topics')
    .select('*')
    .eq('is_archived', false)
    .order('sort_order', { ascending: true });

  const { data: blocks } = await supabase
    .from('content_items')
    .select(`*, topic:env_literacy_topics(label, slug)`)
    .eq('content_type', 'env_literacy_block')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  return <ClientEnvPage initialData={{ topics: topics || [], blocks: blocks || [] }} />;
}
