export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  // Fetch published community session by id
  const { data: session, error } = await supabase
    .from('content_items')
    .select(`
      *,
      media:content_media(*)
    `)
    .eq('content_type', 'community_session')
    .eq('status', 'published')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ session })
}
