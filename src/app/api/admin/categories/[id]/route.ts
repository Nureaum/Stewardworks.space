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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { authorized, status, supabase } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const body = await request.json()
  const { label, slug, is_archived } = body
  
  const updates: any = {}
  if (label !== undefined) updates.label = label
  if (slug !== undefined) updates.slug = slug
  if (is_archived !== undefined) updates.is_archived = is_archived

  const { data, error } = await supabase
    .from('content_categories')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ category: data })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { authorized, status, supabase } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  // Check if there are any ACTIVE content_items using this category
  const { count, error: countError } = await supabase
    .from('content_items')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', params.id)
    .is('deleted_at', null)

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
  
  if (count && count > 0) {
    return NextResponse.json({ error: `Cannot delete book. It has ${count} active topic(s) inside it. Please move or delete the topics first.` }, { status: 400 })
  }

  // Clean up any soft-deleted topics in this category to satisfy foreign key constraints
  await supabase
    .from('content_items')
    .delete()
    .eq('category_id', params.id)
    .not('deleted_at', 'is', null)

  // Now safe to delete the category
  const { error } = await supabase
    .from('content_categories')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
