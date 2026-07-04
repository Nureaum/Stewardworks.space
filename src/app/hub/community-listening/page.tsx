import { createServerSupabaseClient } from '@/utils/supabase/server';
import ListeningWallClient from './ListeningWallClient';
import { auth } from '@clerk/nextjs/server';

export const metadata = {
  title: 'Community Listening | StewardWorks',
};

export default async function CommunityListeningPage() {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  
  let isAdmin = false;
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();
    
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      isAdmin = true;
    }
  }
  
  // Fetch sessions for the wall (published only, limit 6)
  const { data: sessions, error } = await supabase
    .from('listening_sessions')
    .select('*')
    .eq('published', true)
    .order('session_date', { ascending: true })
    .limit(6);

  if (error) {
    console.error('Error fetching sessions:', error);
  }

  const finalSessions = sessions || [];

  return (
    <ListeningWallClient sessions={finalSessions} isAdmin={isAdmin} />
  );
}

