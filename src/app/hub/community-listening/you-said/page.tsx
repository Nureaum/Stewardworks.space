import { createServerSupabaseClient } from '@/utils/supabase/server';
import TraceabilityBoardClient from './TraceabilityBoardClient';

export default async function TraceabilityBoardPage() {
  const supabase = createServerSupabaseClient();
  
  const { data: integrationsData } = await supabase
    .from('integrations')
    .select('*, project_areas(*), listening_sessions(location)');

  const { data: integratedSubmissions } = await supabase
    .from('public_submissions')
    .select('*, project_areas(*)')
    .eq('status', 'integrated');

  // Merge the two sources of integrations
  const integrations = [
    ...(integrationsData || []),
    ...(integratedSubmissions || []).map(sub => ({
      source_type: 'submission',
      quote: sub.reflection,
      voice: sub.name ? `${sub.name} (${sub.age_range})` : 'Anonymous Participant',
      integration_note: sub.integration_note,
      project_areas: sub.project_areas
    }))
  ];

  const { data: areas } = await supabase
    .from('project_areas')
    .select('*');
    
  const { data: sessions } = await supabase
    .from('listening_sessions')
    .select('participants');

  const sessionCount = sessions?.length || 0;
  const participantTotal = sessions?.reduce((sum, s) => sum + (s.participants || 0), 0) || 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body {
          background: linear-gradient(178deg, #f6d9b2 0%, #f2cb9c 48%, #eec091 100%) !important;
          background-attachment: fixed !important;
        }
      `}} />
      <TraceabilityBoardClient 
        integrations={integrations || []} 
        areaStats={areas || []}
        sessionCount={sessionCount}
        participantTotal={participantTotal}
      />
    </>
  );
}
