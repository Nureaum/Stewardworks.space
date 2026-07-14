import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

/**
 * API endpoint to set visitor role for users who signed up via invitation
 * Called immediately after signup to ensure proper role assignment
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[SetVisitorRole] API endpoint called');
    
    const { userId } = await auth()
    
    console.log('[SetVisitorRole] User ID from auth:', userId);
    
    if (!userId) {
      console.log('[SetVisitorRole] No userId - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { isInvitation } = body
    
    console.log('[SetVisitorRole] Request body:', { isInvitation });

    if (!isInvitation) {
      console.log('[SetVisitorRole] Not an invitation signup');
      return NextResponse.json({ error: 'Not an invitation signup' }, { status: 400 })
    }

    console.log(`[SetVisitorRole] Processing role assignment for user ${userId}`)

    const client = await clerkClient()
    const supabase = createServerSupabaseClient()

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

    // 2. Update Supabase profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'guest', // Using 'guest' role as it's allowed by database constraint
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', userId)

    if (updateError) {
      console.error(`[SetVisitorRole] ❌ Supabase update failed:`, updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    
    console.log(`[SetVisitorRole] ✅ Updated Supabase profile to guest for ${userId}`)

    console.log(`[SetVisitorRole] ✅✅✅ Successfully set guest role for ${userId}`)

    return NextResponse.json({ success: true, role: 'guest', userId })
  } catch (err: any) {
    console.error('[SetVisitorRole] ❌❌❌ Fatal error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
