import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

async function verifyAdminAccess() {
  const { userId } = await auth()
  if (!userId) return { authorized: false, error: 'Unauthorized', status: 401 }

  const supabase = createServerSupabaseClient()
  
  // Verify admin or super_admin role in DB
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()
  
  if (profile?.role === 'admin' || profile?.role === 'super_admin') {
    return { authorized: true, supabase, adminId: profile.id, role: profile.role }
  }

  return { authorized: false, error: 'Forbidden: Requires admin access', status: 403 }
}

export async function GET() {
  try {
    const { authorized, error, status, supabase } = await verifyAdminAccess()
    if (!authorized || !supabase) {
      return NextResponse.json({ error }, { status })
    }

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        *,
        updater:profiles!role_updated_by(full_name)
      `)
      .order('created_at', { ascending: false, nullsFirst: false })

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ users: data })
  } catch (err: any) {
    console.error('GET /api/admin/users error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { authorized, error, status, supabase, adminId, role: adminRole } = await verifyAdminAccess()
    if (!authorized || !supabase || !adminId) {
      return NextResponse.json({ error }, { status })
    }
    
    if (adminRole !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Requires super_admin role' }, { status: 403 })
    }

    const superAdminId = adminId;
    const body = await request.json()
    // Here userId is the clerk_user_id of the target user
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 })
    }

    // 1. Get the target user's current profile to ensure we're not demoting the last super_admin
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id, role, clerk_user_id')
      .eq('clerk_user_id', userId)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Edge case: Last super_admin lockout prevention
    if (targetProfile.role === 'super_admin' && role !== 'super_admin') {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin')
      
      if (count && count <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last super_admin. Promote someone else first.' }, { status: 400 })
      }
    }

    const oldRole = targetProfile.role

    // 2. Update the role in Supabase profiles
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: role,
        role_updated_by: superAdminId,
        role_updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', userId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 3. Log the change in role_change_log
    await supabase.from('role_change_log').insert({
      target_profile_id: targetProfile.id,
      changed_by: superAdminId,
      old_role: oldRole,
      new_role: role
    })

    // 4. Update Clerk's publicMetadata
    try {
      const client = await clerkClient()
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          role: role
        }
      })
    } catch (clerkErr) {
      console.error('Failed to sync role to Clerk publicMetadata:', clerkErr)
      // We don't fail the request since DB is the source of truth, but we log it.
    }

    return NextResponse.json({ user: data })
  } catch (err: any) {
    console.error('PATCH /api/admin/users error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, error, status, supabase, role: adminRole } = await verifyAdminAccess()
    if (!authorized || !supabase) {
      return NextResponse.json({ error }, { status })
    }
    
    if (adminRole !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Requires super_admin role' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role, password, first_name, last_name } = body

    if (!email || !role || !password) {
      return NextResponse.json({ error: 'Missing email, role, or password' }, { status: 400 })
    }

    const client = await clerkClient()
    
    // Create the user in Clerk
    const newUser = await client.users.createUser({
      emailAddress: [email],
      password,
      firstName: first_name,
      lastName: last_name,
      publicMetadata: {
        role
      }
    })

    // Upsert the profile in Supabase to ensure they get the right role
    // even before or after the webhook runs
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        clerk_user_id: newUser.id,
        email: email,
        role: role,
        first_name: first_name || null,
        last_name: last_name || null,
        full_name: (first_name || last_name) ? `${first_name || ''} ${last_name || ''}`.trim() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clerk_user_id' })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile for new user in DB:', profileError)
      // We don't fail since Clerk user was created, but ideally this succeeds.
    }

    return NextResponse.json({ success: true, user: profileData || { clerk_user_id: newUser.id, email, role } })
  } catch (err: any) {
    console.error('POST /api/admin/users error:', err)
    // Send back a friendly error message from Clerk if possible
    return NextResponse.json({ error: err.errors?.[0]?.message || err.message || 'Internal server error' }, { status: 500 })
  }
}
