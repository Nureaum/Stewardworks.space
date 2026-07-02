export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

async function verifyAdmin() {
  const { userId } = await auth()
  if (!userId) return { authorized: false, status: 401 }

  const supabase = createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()
  
  if (profile?.role === 'admin' || profile?.role === 'super_admin') {
    return { authorized: true, supabase, profileId: profile.id, role: profile.role }
  }
  return { authorized: false, status: 403 }
}

export async function GET(request: Request) {
  const { authorized, status, supabase, profileId, role } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  let query = supabase
    .from('content_items')
    .select(`
      *,
      category:content_categories(label),
      topic:env_literacy_topics(label),
      media:content_media(*),
      author:profiles!created_by(full_name, email)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (type) {
    query = query.eq('content_type', type)
  }

  if (role !== 'super_admin') {
    query = query.eq('created_by', profileId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data, userRole: role })
}

export async function POST(request: Request) {
  const { authorized, status, supabase, profileId } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const body = await request.json()
  const { topic_label, media, ...rest } = body

  let resolvedTopicId = null

  if (topic_label) {
    // 1. Try to find existing topic by label (case insensitive)
    const { data: existing } = await supabase
      .from('env_literacy_topics')
      .select('id')
      .ilike('label', topic_label)
      .single()

    if (existing) {
      resolvedTopicId = existing.id
    } else {
      // 2. Create it if it doesn't exist
      const slug = topic_label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      const { data: newTopic } = await supabase
        .from('env_literacy_topics')
        .insert({ label: topic_label, slug })
        .select('id')
        .single()
      
      if (newTopic) resolvedTopicId = newTopic.id
    }
  }

  const payload = {
    ...rest,
    ...(resolvedTopicId && { topic_id: resolvedTopicId }),
    created_by: profileId,
    updated_by: profileId
  }

  if (payload.status === 'published') {
    payload.published_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('content_items')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (media && Array.isArray(media) && media.length > 0) {
    const mediaPayload = media.map((m: any, index: number) => ({
      content_item_id: data.id,
      media_type: m.media_type,
      url: m.url,
      label: m.label || null,
      sort_order: index
    }))

    const { error: mediaError } = await supabase
      .from('content_media')
      .insert(mediaPayload)

    if (mediaError) {
      console.error('Failed to insert media', mediaError)
    }
  }

  revalidatePath('/hub/library', 'layout')
  revalidatePath('/hub/bilingual-media', 'layout')
  revalidatePath('/hub/pilot-workshops', 'layout')
  revalidatePath('/hub/environmental-literacy', 'layout')
  revalidatePath('/hub/community-listening', 'layout')

  return NextResponse.json({ item: data })
}
