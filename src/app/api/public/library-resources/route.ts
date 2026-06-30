export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = createServerSupabaseClient()

  // Fetch published library resources
  const { data: resources, error } = await supabase
    .from('content_items')
    .select(`
      *,
      category:content_categories(id, label, slug),
      topic:env_literacy_topics(id, label, slug)
    `)
    .eq('content_type', 'library_resource')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch media separately for all resources
  const resourceIds = (resources || []).map((r: any) => r.id)
  let allMedia: any[] = []
  if (resourceIds.length > 0) {
    const { data: media } = await supabase
      .from('content_media')
      .select('*')
      .in('content_item_id', resourceIds)
      .order('sort_order', { ascending: true })
    allMedia = media || []
  }

  // Merge media into resources
  const enriched = (resources || []).map((r: any) => ({
    ...r,
    media: allMedia.filter((m: any) => m.content_item_id === r.id)
  }))

  return NextResponse.json({ resources: enriched })
}
