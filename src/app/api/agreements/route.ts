import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: agreements, error } = await supabase
      .from('agreements')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ agreements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
