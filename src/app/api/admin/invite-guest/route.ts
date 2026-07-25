import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

async function verifyAdminAccess() {
  const { userId } = await auth()
  if (!userId) return { authorized: false, error: 'Unauthorized', status: 401 }

  const supabase = createServerSupabaseClient()
  
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

export async function POST(request: NextRequest) {
  try {
    const { authorized, error, status } = await verifyAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error }, { status })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 })
    }

    const client = await clerkClient()
    
    console.log('[InviteGuest] Creating invitation for:', email);
    console.log('[InviteGuest] Redirect URL:', `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup`);
    
    // Create an invitation in Clerk for the guest/visitor
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        role: 'guest' // Using 'guest' role - it's the allowed role for contributors in the database
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup`,
      ignoreExisting: true,
    })

    console.log('[InviteGuest] ✅ Invitation created successfully');
    console.log('[InviteGuest] Invitation ID:', invitation.id);
    console.log('[InviteGuest] Invitation publicMetadata:', JSON.stringify(invitation.publicMetadata));
    console.log('[InviteGuest] Invitation status:', invitation.status);

    return NextResponse.json({ success: true, invitation })
  } catch (err: any) {
    console.error('POST /api/admin/invite-guest error:', err)
    return NextResponse.json({ error: err.errors?.[0]?.message || err.message || 'Internal server error' }, { status: 500 })
  }
}
