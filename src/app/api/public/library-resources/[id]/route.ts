export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { id } = params

  const { data: resource, error } = await supabase
    .from('content_items')
    .select(`
      *,
      category:content_categories(id, label, slug),
      topic:env_literacy_topics(id, label, slug)
    `)
    .eq('id', id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch media separately to avoid RLS join issues
  const { data: media } = await supabase
    .from('content_media')
    .select('*')
    .eq('content_item_id', id)
    .order('sort_order', { ascending: true })

  return NextResponse.json({ resource: { ...resource, media: media || [] } })
}
