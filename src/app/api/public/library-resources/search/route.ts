export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title') || ''
  const url = request.nextUrl.searchParams.get('url') || ''
  
  if (!title && !url) {
    return NextResponse.json({ id: null })
  }

  const supabase = createServerSupabaseClient()

  // Try to find by exact title first
  if (title) {
    const { data } = await supabase
      .from('content_items')
      .select('id')
      .eq('content_type', 'library_resource')
      .eq('status', 'published')
      .is('deleted_at', null)
      .ilike('title', title)
      .limit(1)
      .maybeSingle()
    
    if (data) return NextResponse.json({ id: data.id })
  }

  // Try by external_url
  if (url) {
    const { data } = await supabase
      .from('content_items')
      .select('id')
      .eq('content_type', 'library_resource')
      .eq('status', 'published')
      .is('deleted_at', null)
      .eq('external_url', url)
      .limit(1)
      .maybeSingle()
    
    if (data) return NextResponse.json({ id: data.id })

    // Try matching media URL
    const { data: media } = await supabase
      .from('content_media')
      .select('content_item_id')
      .eq('url', url)
      .limit(1)
      .maybeSingle()
    
    if (media) return NextResponse.json({ id: media.content_item_id })
  }

  return NextResponse.json({ id: null })
}
