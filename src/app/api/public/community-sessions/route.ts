export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = createServerSupabaseClient()

  // Fetch published community sessions
  const { data: sessions, error } = await supabase
    .from('content_items')
    .select(`
      *,
      media:content_media(*)
    `)
    .eq('content_type', 'community_session')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ sessions })
}
