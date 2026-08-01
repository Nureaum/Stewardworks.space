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

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { authorized, status, supabase } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const body = await request.json()
  const { label } = body

  if (!label || !label.trim()) {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 })
  }

  const newLabel = label.trim().toUpperCase();

  // First, get the old tag so we can update content_items
  const { data: oldTag, error: fetchError } = await supabase
    .from('reference_tags')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('reference_tags')
    .update({ label: newLabel })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A tag with this name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update existing content items that used the old label
  if (oldTag.label !== newLabel) {
    const { data: items } = await supabase
      .from('content_items')
      .select('id, reference_tags')
      .contains('reference_tags', [oldTag.label]);

    if (items && items.length > 0) {
      for (const item of items) {
        if (item.reference_tags) {
          const newTags = item.reference_tags.map((t: string) => t === oldTag.label ? newLabel : t);
          await supabase.from('content_items').update({ reference_tags: newTags }).eq('id', item.id);
        }
      }
    }
  }

  return NextResponse.json({ tag: data })
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { authorized, status, supabase } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  // Optional: clear out references in content_items if deleted, but maybe we just let them keep the text label
  // Let's clear them so it's clean
  const { data: oldTag } = await supabase
    .from('reference_tags')
    .select('*')
    .eq('id', params.id)
    .single();

  if (oldTag) {
    const { data: items } = await supabase
      .from('content_items')
      .select('id, reference_tags')
      .contains('reference_tags', [oldTag.label]);

    if (items && items.length > 0) {
      for (const item of items) {
        if (item.reference_tags) {
          const newTags = item.reference_tags.filter((t: string) => t !== oldTag.label);
          await supabase.from('content_items').update({ reference_tags: newTags }).eq('id', item.id);
        }
      }
    }
  }

  const { error } = await supabase
    .from('reference_tags')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
