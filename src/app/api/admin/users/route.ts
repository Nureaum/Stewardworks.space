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

export async function DELETE(request: NextRequest) {
  try {
    const { authorized, error, status, supabase, adminId, role: adminRole } = await verifyAdminAccess()
    if (!authorized || !supabase || !adminId) {
      return NextResponse.json({ error }, { status })
    }

    if (adminRole !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Requires super_admin role' }, { status: 403 })
    }

    const body = await request.json()
    const { userId } = body // userId is the clerk_user_id of the target user

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // 1. Get the target user's profile
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id, role, clerk_user_id, email')
      .eq('clerk_user_id', userId)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // 2. Prevent deleting a super_admin
    if (targetProfile.role === 'super_admin') {
      return NextResponse.json({ error: 'Cannot delete a super_admin user. Demote them first.' }, { status: 400 })
    }

    // 3. Prevent self-deletion
    if (targetProfile.id === adminId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // 4. Delete the user from Clerk
    try {
      const client = await clerkClient()
      await client.users.deleteUser(userId)
    } catch (clerkErr: any) {
      console.error('Failed to delete user from Clerk. userId:', userId, 'Error:', JSON.stringify(clerkErr, null, 2))
      
      // Check if it's a "not found" error — user already deleted or never existed in Clerk
      const isNotFound = 
        clerkErr?.status === 404 || 
        clerkErr?.clerkError && clerkErr?.errors?.some((e: any) => e.code === 'resource_not_found') ||
        clerkErr?.message?.includes('not found')
      
      if (isNotFound) {
        console.log('User not found in Clerk (already deleted or never synced). Proceeding with DB cleanup.')
      } else {
        const clerkMessage = clerkErr?.errors?.[0]?.longMessage || clerkErr?.errors?.[0]?.message || clerkErr?.message || 'Unknown Clerk error'
        return NextResponse.json({ error: `Failed to delete from auth: ${clerkMessage}` }, { status: 500 })
      }
    }

    // 5. Clean up all FK references before deleting the profile
    const profileId = targetProfile.id

    // Helper to safely run a cleanup query and log (but not throw) on failure
    const safeCleanup = async (label: string, query: PromiseLike<{ error: any }>) => {
      const { error: cleanupErr } = await query
      if (cleanupErr) {
        console.warn(`[delete-user] Cleanup warning for "${label}":`, cleanupErr.message)
      }
    }

    // --- Nullify authored/managed references (preserve content, remove author link) ---
    await safeCleanup('content_items.created_by', supabase.from('content_items').update({ created_by: null }).eq('created_by', profileId))
    await safeCleanup('content_items.updated_by', supabase.from('content_items').update({ updated_by: null }).eq('updated_by', profileId))
    await safeCleanup('job_profiles.created_by', supabase.from('job_profiles').update({ created_by: null }).eq('created_by', profileId))
    await safeCleanup('job_profiles.updated_by', supabase.from('job_profiles').update({ updated_by: null }).eq('updated_by', profileId))
    await safeCleanup('ai_labs.created_by', supabase.from('ai_labs').update({ created_by: null }).eq('created_by', profileId))
    await safeCleanup('cohorts.created_by', supabase.from('cohorts').update({ created_by: null }).eq('created_by', profileId))
    await safeCleanup('cohorts.updated_by', supabase.from('cohorts').update({ updated_by: null }).eq('updated_by', profileId))
    await safeCleanup('workshop_days.created_by', supabase.from('workshop_days').update({ created_by: null }).eq('created_by', profileId))
    await safeCleanup('workshop_days.updated_by', supabase.from('workshop_days').update({ updated_by: null }).eq('updated_by', profileId))
    await safeCleanup('announcements.created_by', supabase.from('announcements').update({ created_by: null }).eq('created_by', profileId))
    await safeCleanup('profiles.role_updated_by', supabase.from('profiles').update({ role_updated_by: null }).eq('role_updated_by', profileId))

    // --- Delete user-specific records (order matters: children before parents) ---

    // Deliverable submissions MUST be deleted before workshop_progress / workshop_registrations
    await safeCleanup('workshop_deliverable_submissions', supabase.from('workshop_deliverable_submissions').delete().eq('profile_id', profileId))

    // Now safe to delete progress, engagement, registrations, characters
    await safeCleanup('workshop_submissions', supabase.from('workshop_submissions').delete().eq('profile_id', profileId))
    await safeCleanup('workshop_progress', supabase.from('workshop_progress').delete().eq('profile_id', profileId))
    await safeCleanup('workshop_engagement', supabase.from('workshop_engagement').delete().eq('profile_id', profileId))
    await safeCleanup('workshop_registrations', supabase.from('workshop_registrations').delete().eq('profile_id', profileId))
    await safeCleanup('workshop_characters', supabase.from('workshop_characters').delete().eq('profile_id', profileId))

    // Audit / log tables
    await safeCleanup('role_change_log (target)', supabase.from('role_change_log').delete().eq('target_profile_id', profileId))
    await safeCleanup('role_change_log (changed_by)', supabase.from('role_change_log').delete().eq('changed_by', profileId))

    // Notifications and community data
    await safeCleanup('notifications', supabase.from('notifications').delete().eq('profile_id', profileId))
    await safeCleanup('helpdesk_answers', supabase.from('helpdesk_answers').delete().eq('author_id', profileId))
    await safeCleanup('helpdesk_questions', supabase.from('helpdesk_questions').delete().eq('author_id', profileId))
    await safeCleanup('community_suggestions', supabase.from('community_suggestions').delete().eq('profile_id', profileId))

    // Old bookmark system (keyed by Clerk userId, not profile id)
    await safeCleanup('user_bookmarks', supabase.from('user_bookmarks').delete().eq('user_id', userId))

    // 6. Delete the user's profile from Supabase
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('clerk_user_id', userId)

    if (deleteError) {
      console.error('Failed to delete profile from Supabase:', deleteError)
      return NextResponse.json({ error: `User removed from auth but failed to remove from database: ${deleteError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (err: any) {
    console.error('DELETE /api/admin/users error:', err)
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
