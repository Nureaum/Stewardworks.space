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

export async function GET() {
  const { authorized, status, supabase } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const { data, error } = await supabase
    .from('content_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ categories: data })
}

export async function POST(request: Request) {
  const { authorized, status, supabase } = await verifyAdmin()
  if (!authorized || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status })

  const body = await request.json()
  const { label, slug } = body

  const { data, error } = await supabase
    .from('content_categories')
    .insert({ label, slug })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ category: data })
}
