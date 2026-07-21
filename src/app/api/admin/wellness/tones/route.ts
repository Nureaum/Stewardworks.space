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

// POST — create a new tone
export async function POST(request: Request) {
  const { authorized, status, supabase, profileId } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const body = await request.json()
  const { name, frequency, wave_type, gain, sort_order } = body

  if (!name || !frequency) {
    return NextResponse.json({ error: 'name and frequency are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('wellness_tones')
    .insert({
      name,
      frequency: Number(frequency),
      wave_type: wave_type || 'sine',
      gain: gain != null ? Number(gain) : 0.05,
      sort_order: sort_order ?? 0,
      updated_by: profileId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tone: data })
}

// PUT — update an existing tone
export async function PUT(request: Request) {
  const { authorized, status, supabase, profileId } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const body = await request.json()
  const { id, name, frequency, wave_type, gain, is_active, sort_order } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const update: Record<string, any> = {
    updated_at: new Date().toISOString(),
    updated_by: profileId,
  }
  if (name !== undefined) update.name = name
  if (frequency !== undefined) update.frequency = Number(frequency)
  if (wave_type !== undefined) update.wave_type = wave_type
  if (gain !== undefined) update.gain = Number(gain)
  if (is_active !== undefined) update.is_active = is_active
  if (sort_order !== undefined) update.sort_order = sort_order

  const { data, error } = await supabase
    .from('wellness_tones')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tone: data })
}

// DELETE — delete a tone by id
export async function DELETE(request: Request) {
  const { authorized, status, supabase } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('wellness_tones')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
