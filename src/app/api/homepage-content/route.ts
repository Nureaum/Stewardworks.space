import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('system_bulletins')
      .select('homepage_title, homepage_subtitle')
      .eq('id', 1)
      .single();

    return NextResponse.json({
      homepage_title: data?.homepage_title || '',
      homepage_subtitle: data?.homepage_subtitle || '',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
  } catch {
    return NextResponse.json({ homepage_title: '', homepage_subtitle: '' });
  }
}
