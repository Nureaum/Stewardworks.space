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

// GET — fetch all wellness resources + all tones (including inactive)
export async function GET() {
  const { authorized, status, supabase } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const [resourcesRes, tonesRes] = await Promise.all([
    supabase
      .from('wellness_resources')
      .select('*')
      .order('sort_order', { ascending: true }),
    supabase
      .from('wellness_tones')
      .select('*')
      .order('sort_order', { ascending: true }),
  ])

  // If no resources exist yet, provide default editable cards
  let resources = resourcesRes.data || [];
  if (resources.length === 0) {
    resources = [
      { slot_key: 'grounding', label: 'GROUNDING', title: '4-7-8 Breathing', description: 'Inhale 4 · hold 7 · exhale 8.', sort_order: 0 },
      { slot_key: 'support', label: 'SUPPORT', title: '988 Lifeline', description: 'Call or text 988 anytime, free & confidential.', sort_order: 1 },
      { slot_key: 'text', label: 'TEXT', title: 'Crisis Text Line', description: 'Text HOME to 741741.', sort_order: 2 },
    ];
  }

  return NextResponse.json({
    resources,
    tones: tonesRes.data || [],
  })
}

// PUT — bulk-update the resource cards (delete all + reinsert to avoid constraint issues)
export async function PUT(request: Request) {
  const { authorized, status, supabase, profileId } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const { resources } = await request.json()

  if (!Array.isArray(resources)) {
    return NextResponse.json({ error: 'resources must be an array' }, { status: 400 })
  }

  // Delete all existing resources
  const { error: deleteError } = await supabase
    .from('wellness_resources')
    .delete()
    .neq('slot_key', '__never_match__') // deletes all rows

  if (deleteError) {
    console.error('[wellness PUT] Delete failed:', deleteError)
    return NextResponse.json({ error: 'Failed to clear old resources: ' + deleteError.message }, { status: 500 })
  }

  // Insert all resources fresh
  if (resources.length > 0) {
    const payload = resources.map((r: any, idx: number) => ({
      slot_key: r.slot_key,
      label: r.label,
      title: r.title,
      description: r.description,
      sort_order: r.sort_order ?? idx,
      updated_at: new Date().toISOString(),
      updated_by: profileId,
    }))

    const { error: insertError } = await supabase
      .from('wellness_resources')
      .insert(payload)

    if (insertError) {
      console.error('[wellness PUT] Insert failed:', insertError)
      return NextResponse.json({ error: 'Failed to save resources: ' + insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
