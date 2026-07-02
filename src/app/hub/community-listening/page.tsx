import ClientCommunityPage from './ClientCommunityPage';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CommunityListeningPage() {
  const supabase = createServerSupabaseClient();

  const { data: sessions } = await supabase
    .from('content_items')
    .select(`*, media:content_media(*)`)
    .eq('content_type', 'community_session')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return <ClientCommunityPage initialSessions={sessions || []} />;
}
