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

  return NextResponse.json({
    resources: resourcesRes.data || [],
    tones: tonesRes.data || [],
  })
}

// PUT — bulk-update the 3 resource cards
export async function PUT(request: Request) {
  const { authorized, status, supabase, profileId } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const { resources } = await request.json()

  if (!Array.isArray(resources)) {
    return NextResponse.json({ error: 'resources must be an array' }, { status: 400 })
  }

  const errors: string[] = []

  for (const r of resources) {
    const { error } = await supabase
      .from('wellness_resources')
      .update({
        label: r.label,
        title: r.title,
        description: r.description,
        sort_order: r.sort_order,
        updated_at: new Date().toISOString(),
        updated_by: profileId,
      })
      .eq('slot_key', r.slot_key)

    if (error) errors.push(`${r.slot_key}: ${error.message}`)
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
