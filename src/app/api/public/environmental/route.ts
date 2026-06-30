export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = createServerSupabaseClient()

  // 1. Fetch topics
  const { data: topics, error: topicError } = await supabase
    .from('env_literacy_topics')
    .select('*')
    .eq('is_archived', false)
    .order('sort_order', { ascending: true })

  if (topicError) return NextResponse.json({ error: topicError.message }, { status: 500 })

  // 2. Fetch published blocks
  const { data: blocks, error: blocksError } = await supabase
    .from('content_items')
    .select(`
      *,
      topic:env_literacy_topics(label, slug)
    `)
    .eq('content_type', 'env_literacy_block')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (blocksError) return NextResponse.json({ error: blocksError.message }, { status: 500 })

  return NextResponse.json({ topics, blocks })
}
