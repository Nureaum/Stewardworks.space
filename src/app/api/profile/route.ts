import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'

/**
 * GET /api/profile
 * Fetches the authenticated user's profile from Supabase.
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = row not found
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-create profile if it doesn't exist
    if (!data) {
      const user = await currentUser()
      const email = user?.emailAddresses?.[0]?.emailAddress
      const firstName = user?.firstName || ''
      const lastName = user?.lastName || ''
      const phone = user?.unsafeMetadata?.phone as string | undefined

      const newProfile = {
        clerk_user_id: userId,
        email: email || '',
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        phone: phone || '',
      }

      const { data: createdData, error: createError } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'clerk_user_id' })
        .select()
        .single()

      if (createError) {
        console.error('Auto-create profile error:', createError)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      return NextResponse.json({ profile: createdData })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('GET /api/profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/profile
 * Creates or updates (upserts) the authenticated user's profile.
 * Also syncs Clerk user email into the profile.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = createServerSupabaseClient()

    // Get email from Clerk
    const user = await currentUser()
    const email = user?.emailAddresses?.[0]?.emailAddress

    // Always enforce the authenticated user's ID and email
    const payload = {
      ...body,
      clerk_user_id: userId,
      ...(email && { email }),
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'clerk_user_id' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('POST /api/profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/profile
 * Updates specific fields on the authenticated user's profile.
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = createServerSupabaseClient()

    // Don't allow overriding id, clerk_user_id or email via PATCH
    const { id: _id, clerk_user_id: _cuid, email: _email, ...safeBody } = body

    const { data, error } = await supabase
      .from('profiles')
      .update(safeBody)
      .eq('clerk_user_id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('PATCH /api/profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
