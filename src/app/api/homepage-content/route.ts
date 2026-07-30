import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  // Opt out of all Next.js caching — always read live data from Supabase
  noStore();
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from('system_bulletins')
      .select('homepage_title, homepage_subtitle, demo_video_url')
      .eq('id', 1)
      .single();

    return NextResponse.json({
      homepage_title: data?.homepage_title || '',
      homepage_subtitle: data?.homepage_subtitle || '',
      demo_video_url: data?.demo_video_url || '',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
  } catch {
    return NextResponse.json({ homepage_title: '', homepage_subtitle: '', demo_video_url: '' });
  }
}
