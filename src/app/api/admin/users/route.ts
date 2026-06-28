import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

const ADMIN_EMAIL = 'vaniibodasingu@gmail.com';

async function verifyAdmin() {
  const { userId } = await auth()
  if (!userId) return { authorized: false, error: 'Unauthorized', status: 401 }

  const user = await currentUser()
  if (user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL) {
    return { authorized: true, supabase: createServerSupabaseClient() }
  }

  const supabase = createServerSupabaseClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  
  if (data?.role === 'admin' || data?.role_name === 'admin') {
    return { authorized: true, supabase }
  }

  return { authorized: false, error: 'Forbidden', status: 403 }
}

export async function GET() {
  try {
    const { authorized, error, status, supabase } = await verifyAdmin()
    if (!authorized || !supabase) {
      return NextResponse.json({ error }, { status })
    }

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false, nullsFirst: false })

    if (fetchError) {
      // Sometimes created_at might not exist, let's try without order if it fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('profiles')
        .select('*')
      
      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }
      return NextResponse.json({ users: fallbackData })
    }

    return NextResponse.json({ users: data })
  } catch (err: any) {
    console.error('GET /api/admin/users error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const clerkUser = await currentUser()
    const isMainAdmin = clerkUser?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;
    
    if (!isMainAdmin) {
      return NextResponse.json({ error: 'Only the main admin can change user roles.' }, { status: 403 })
    }

    const { supabase } = await verifyAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, role, email } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 })
    }

    // Prevent changing the main admin's role
    if (email === ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Cannot change the role of the main admin.' }, { status: 403 })
    }

    // We update both role and role_name to cover our bases
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ role: role, role_name: role })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (err: any) {
    console.error('PATCH /api/admin/users error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
