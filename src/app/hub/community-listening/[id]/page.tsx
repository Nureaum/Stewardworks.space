import { createServerSupabaseClient } from '@/utils/supabase/server';
import SessionDashboardClient from '../SessionDashboardClient';

export default async function SessionPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const slugOrId = params.id;

  // Check if it's a UUID to avoid Postgres syntax error on id.eq
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
  
  let query = supabase.from('listening_sessions').select('*').limit(1);
  if (isUuid) {
    query = query.or(`slug.eq.${slugOrId},id.eq.${slugOrId}`);
  } else {
    query = query.eq('slug', slugOrId);
  }
  
  const { data: sessions, error } = await query;
  if (error) console.error('Error fetching session:', error);
    
  const session = sessions?.[0];

  if (!session) {
    return <SessionDashboardClient session={null} quotes={[]} photos={[]} integrations={[]} />;
  }

  // Fetch related data
  const { data: quotes } = await supabase
    .from('session_quotes')
    .select('*')
    .eq('session_id', session.id)
    .order('sort', { ascending: true });

  const { data: photos } = await supabase
    .from('session_photos')
    .select('*')
    .eq('session_id', session.id)
    .order('sort', { ascending: true });

  const { data: integrations } = await supabase
    .from('integrations')
    .select('*, project_areas(*)')
    .eq('session_id', session.id);

  return (
    <SessionDashboardClient 
      session={session} 
      quotes={quotes || []} 
      photos={photos || []} 
      integrations={integrations || []} 
    />
  );
}
