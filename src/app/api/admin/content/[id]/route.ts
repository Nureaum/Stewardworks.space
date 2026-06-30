export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { auth } from '@clerk/nextjs/server'

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
    return { authorized: true, supabase, profileId: profile.id }
  }
  return { authorized: false, status: 403 }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { authorized, status, supabase, profileId } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const body = await request.json()
  console.log('PUT PAYLOAD:', body)
  const id = params.id
  
  const { topic_label, media, ...rest } = body

  let resolvedTopicId = null

  if (topic_label) {
    // 1. Try to find existing topic by label
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
    updated_by: profileId,
    updated_at: new Date().toISOString()
  }

  // If newly published, update published_at
  if (payload.status === 'published') {
    const { data: existing } = await supabase.from('content_items').select('status').eq('id', id).single()
    if (existing?.status !== 'published') {
      payload.published_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('content_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Handle media updates by deleting existing and inserting new
  if (media && Array.isArray(media)) {
    console.log(`[PUT media] Received ${media.length} media items for ${id}`)
    console.log('[PUT media] Items:', JSON.stringify(media, null, 2))
    
    // Delete existing media
    const { error: deleteError } = await supabase.from('content_media').delete().eq('content_item_id', id)
    if (deleteError) console.error('[PUT media] Delete failed:', deleteError)
    else console.log('[PUT media] Delete existing OK')

    // Insert new media if any
    if (media.length > 0) {
      const mediaPayload = media.map((m: any, index: number) => ({
        content_item_id: id,
        media_type: m.media_type,
        url: m.url,
        label: m.label || null,
        sort_order: index
      }))

      console.log('[PUT media] Inserting payload:', JSON.stringify(mediaPayload, null, 2))

      const { data: insertedMedia, error: mediaError } = await supabase
        .from('content_media')
        .insert(mediaPayload)
        .select()

      if (mediaError) {
        console.error('[PUT media] Insert FAILED:', mediaError)
      } else {
        console.log(`[PUT media] Insert OK: ${insertedMedia?.length} rows inserted`)
      }
    }
  } else {
    console.log('[PUT media] No media array in payload')
  }

  return NextResponse.json({ item: data })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { authorized, status, supabase, profileId } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const id = params.id

  const { error } = await supabase
    .from('content_items')
    .update({ 
      deleted_at: new Date().toISOString(),
      updated_by: profileId,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
