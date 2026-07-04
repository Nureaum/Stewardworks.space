import { createServerSupabaseClient } from '@/utils/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AdminConsoleClient from './AdminConsoleClient';

export const metadata = {
  title: 'Admin Console | Community Listening',
};

export default async function AdminCommunityListeningPage() {
  const supabase = createServerSupabaseClient();
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/login');
  }

  // Security check: Only allow admins
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single();
  
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/hub/community-listening');
  }

  // Fetch all sessions (published and drafts)
  const { data: s } = await supabase
    .from('listening_sessions')
    .select('*, quotes:session_quotes(*), suggestions:integrations(*), photos:session_photos(*)')
    .order('session_date', { ascending: true });
    
  let allSessions = (s || []).map(session => ({
    ...session,
    quote_count: session.quotes?.length || 0,
    suggestion_count: session.suggestions?.length || 0,
  }));
  
  // Fetch all submissions for the Suggestion Inbox
  const { data: sub } = await supabase
    .from('public_submissions')
    .select('*')
    .order('created_at', { ascending: false });
    
  const submissions = sub || [];

  // Fetch project areas
  const { data: a } = await supabase.from('project_areas').select('*').order('sort', { ascending: true });
  const areas = a || [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body {
          background: linear-gradient(178deg, #f6d9b2 0%, #f2cb9c 48%, #eec091 100%) !important;
          background-attachment: fixed !important;
        }
      `}} />
      <div style={{ width: '100%', minHeight: '100vh', position: 'relative', overflowX: 'hidden', color: '#4a3728' }}>
        <AdminConsoleClient sessions={allSessions} submissions={submissions} areas={areas} />
      </div>
    </>
  );
}
