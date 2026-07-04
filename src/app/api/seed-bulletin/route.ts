import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  
  const updates = [
    { tag: 'Onboarding', title: 'Public Onboarding Bulletin is live', body: 'The public-facing page people see before they join...', detail: 'The onboarding bulletin walks newcomers through the three ways to plug in...', cta_label: 'Learn more' },
    { tag: 'Workforce', title: 'Workforce Pathways — Cohort 02 applications open', body: 'The next paid training cohort is accepting applications now...', detail: 'Cohort 02 runs 14 weeks starting September 2026...', cta_label: 'Apply now' }
  ];

  const events = [
    { badge: 'Listening Session', title: 'Calipatria Community Listening Session', event_date: 'Thu, Jul 17, 2026', event_time: '6:00 – 7:30 PM', location: 'Calipatria Public Library' },
    { badge: 'Info Night', title: 'IVC MESA Program Info Night', event_date: 'Wed, Jul 23, 2026', event_time: '5:30 – 7:00 PM', location: 'Imperial Valley College, Bldg 2100' }
  ];

  const { error: err1 } = await supabase.from('bulletin_updates').insert(updates);
  if (err1) {
    return NextResponse.json({ success: false, message: 'Failed to seed updates. Did you run the CREATE TABLE script?', error: err1.message }, { status: 500 });
  }

  const { error: err2 } = await supabase.from('bulletin_events').insert(events);
  if (err2) {
    return NextResponse.json({ success: false, message: 'Failed to seed events. Did you run the CREATE TABLE script?', error: err2.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Data seeded successfully!' });
}
