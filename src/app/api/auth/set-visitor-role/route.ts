import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

/**
 * API endpoint to set visitor role for users who signed up via invitation
 * Called immediately after signup to ensure proper role assignment
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[SetVisitorRole] ====== API ENDPOINT CALLED ======');
    console.log('[SetVisitorRole] Request URL:', request.url);
    console.log('[SetVisitorRole] Request headers:', JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2));
    
    const { userId } = await auth()
    
    console.log('[SetVisitorRole] User ID from auth:', userId);
    
    if (!userId) {
      console.log('[SetVisitorRole] ❌ No userId - unauthorized. Auth returned null.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { isInvitation, checkServerSide } = body
    
    console.log('[SetVisitorRole] Request body:', { isInvitation, checkServerSide });

    const client = await clerkClient()
    const supabase = createServerSupabaseClient()

    // If checkServerSide is true, verify the user was actually invited by checking Clerk
    if (checkServerSide) {
      console.log('[SetVisitorRole] Checking server-side if user was invited...');
      try {
        const currentUser = await client.users.getUser(userId)
        console.log('[SetVisitorRole] User created via:', currentUser.externalAccounts?.length ? 'OAuth' : 'email');
        console.log('[SetVisitorRole] User publicMetadata:', JSON.stringify(currentUser.publicMetadata));
        
        // Check if user already has guest role set
        if (currentUser.publicMetadata?.role === 'guest') {
          console.log('[SetVisitorRole] User already has guest role in metadata - proceeding');
        } else {
          // Check Clerk invitations for this email
          const userEmail = currentUser.emailAddresses?.[0]?.emailAddress
          console.log('[SetVisitorRole] Checking invitations for email:', userEmail);
          
          if (userEmail) {
            const invitations = await client.invitations.getInvitationList()
            const matchingInvite = invitations.data.find(
              (inv: any) => inv.emailAddress === userEmail && inv.publicMetadata?.role === 'guest'
            )
            
            console.log('[SetVisitorRole] Total invitations found:', invitations.data.length);
            console.log('[SetVisitorRole] Matching invitation for this email:', matchingInvite ? 'YES' : 'NO');
            
            if (matchingInvite) {
              console.log('[SetVisitorRole] ✅ Found matching invitation - user IS an invited guest');
              console.log('[SetVisitorRole] Invitation details:', JSON.stringify({
                id: matchingInvite.id,
                status: matchingInvite.status,
                publicMetadata: matchingInvite.publicMetadata
              }));
            } else {
              console.log('[SetVisitorRole] ❌ No matching invitation found - user is NOT an invited guest');
              return NextResponse.json({ error: 'Not an invited user' }, { status: 400 })
            }
          } else {
            console.log('[SetVisitorRole] No email found on user - cannot verify invitation');
            return NextResponse.json({ error: 'No email on user' }, { status: 400 })
          }
        }
      } catch (checkError) {
        console.error('[SetVisitorRole] Error checking invitation status:', checkError);
        // If we can't verify, don't set the role
        return NextResponse.json({ error: 'Failed to verify invitation status' }, { status: 500 })
      }
    } else if (!isInvitation) {
      console.log('[SetVisitorRole] Not an invitation signup');
      return NextResponse.json({ error: 'Not an invitation signup' }, { status: 400 })
    }

    console.log(`[SetVisitorRole] Processing role assignment for user ${userId}`)

    // First, check what the current user metadata looks like
    try {
      const currentUser = await client.users.getUser(userId)
      console.log('[SetVisitorRole] Current user publicMetadata:', JSON.stringify(currentUser.publicMetadata));
      console.log('[SetVisitorRole] Current user privateMetadata:', JSON.stringify(currentUser.privateMetadata));
    } catch (getUserErr) {
      console.error('[SetVisitorRole] Failed to get current user:', getUserErr);
    }

    // 1. Update Clerk publicMetadata
    try {
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          role: 'guest' // Using 'guest' role as it's allowed by database constraint
        }
      })
      console.log(`[SetVisitorRole] ✅ Updated Clerk publicMetadata to guest for ${userId}`)
    } catch (clerkError) {
      console.error(`[SetVisitorRole] ❌ Clerk update failed:`, clerkError);
      throw clerkError;
    }

    // 2. Check current Supabase profile before update
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, role, clerk_user_id, email')
      .eq('clerk_user_id', userId)
      .single()
    
    console.log('[SetVisitorRole] Current Supabase profile:', JSON.stringify(currentProfile));
    if (fetchError) {
      console.error('[SetVisitorRole] Error fetching current profile:', fetchError);
    }

    // 3. Update Supabase profile (use upsert in case webhook hasn't created the profile yet - common in local dev)
    // If profile doesn't exist, include user details from Clerk
    let upsertPayload: any = {
      clerk_user_id: userId,
      role: 'guest',
      updated_at: new Date().toISOString()
    }
    
    if (!currentProfile) {
      // Profile doesn't exist - include full user details from Clerk
      try {
        const fullUser = await client.users.getUser(userId)
        upsertPayload.email = fullUser.emailAddresses?.[0]?.emailAddress || ''
        upsertPayload.first_name = fullUser.firstName || ''
        upsertPayload.last_name = fullUser.lastName || ''
        upsertPayload.full_name = [fullUser.firstName, fullUser.lastName].filter(Boolean).join(' ') || ''
        upsertPayload.phone = (fullUser.unsafeMetadata as any)?.phone || ''
        console.log('[SetVisitorRole] Profile does not exist - creating with full user data:', JSON.stringify(upsertPayload))
      } catch (userFetchErr) {
        console.error('[SetVisitorRole] Failed to fetch user details for profile creation:', userFetchErr)
      }
    }

    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .upsert(upsertPayload, { onConflict: 'clerk_user_id' })
      .select()

    if (updateError) {
      console.error(`[SetVisitorRole] ❌ Supabase upsert failed:`, updateError)
      
      // Fallback: try a simple update if upsert fails (might be missing required fields)
      console.log('[SetVisitorRole] Trying fallback update...');
      const { error: fallbackError, data: fallbackData } = await supabase
        .from('profiles')
        .update({ 
          role: 'guest',
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', userId)
        .select()
      
      if (fallbackError) {
        console.error(`[SetVisitorRole] ❌ Fallback update also failed:`, fallbackError)
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }
      console.log(`[SetVisitorRole] ✅ Fallback update succeeded:`, JSON.stringify(fallbackData))
    } else {
      console.log(`[SetVisitorRole] ✅ Supabase upsert succeeded:`, JSON.stringify(updateData))
    }
    console.log(`[SetVisitorRole] ✅✅✅ Successfully set guest role for ${userId}`)

    return NextResponse.json({ success: true, role: 'guest', userId })
  } catch (err: any) {
    console.error('[SetVisitorRole] ❌❌❌ Fatal error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
