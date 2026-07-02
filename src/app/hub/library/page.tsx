import ClientLibraryPage from './ClientLibraryPage';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const supabase = createServerSupabaseClient();

  const { data: resources } = await supabase
    .from('content_items')
    .select(`
      *,
      category:content_categories(id, label, slug),
      topic:env_literacy_topics(id, label, slug)
    `)
    .eq('content_type', 'library_resource')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return <ClientLibraryPage initialResources={resources || []} />;
}
