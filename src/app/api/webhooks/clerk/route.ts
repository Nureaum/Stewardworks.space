import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  const { id } = evt.data
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id: clerkUserId, email_addresses, first_name, last_name, public_metadata, unsafe_metadata } = evt.data
    const email = email_addresses[0]?.email_address
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || ''

    const supabase = createServerSupabaseClient()
    
    // Check if the user is a visitor/guest based on their invitation metadata
    const roleFromMetadata = public_metadata?.role as string | undefined;
    
    console.log(`[Webhook] Processing ${eventType} for user ${clerkUserId}`)
    console.log(`[Webhook] Role from metadata:`, roleFromMetadata)
    console.log(`[Webhook] Full public_metadata:`, JSON.stringify(public_metadata, null, 2))

    // Build the upsert payload
    const upsertPayload: any = {
      clerk_user_id: clerkUserId,
      email: email,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    };

    // Save terms acceptance data if present in unsafeMetadata
    if (eventType === 'user.created' && unsafe_metadata) {
      const termsAccepted = (unsafe_metadata as any)?.terms_accepted;
      const termsAcceptedAt = (unsafe_metadata as any)?.terms_accepted_at;
      const termsSignature = (unsafe_metadata as any)?.terms_signature;
      if (termsAccepted) {
        upsertPayload.terms_accepted_at = termsAcceptedAt || new Date().toISOString();
        upsertPayload.terms_signature = termsSignature || '';
      }
    }

    // If they were invited as a guest, explicitly set the role
    // Only do this on user.created so we don't accidentally overwrite an admin role
    if (eventType === 'user.created' && roleFromMetadata === 'guest') {
      upsertPayload.role = 'guest'; // Use 'guest' as it's allowed by database constraint
      console.log(`[Webhook] Setting role to 'guest' for invited user ${clerkUserId}`)
    } else if (eventType === 'user.created') {
      // For new users without invitation metadata, set default role as 'participant'
      upsertPayload.role = 'participant';
      console.log(`[Webhook] Setting role to 'participant' for regular signup ${clerkUserId}`)
    }
    
    console.log(`[Webhook] Upsert payload:`, JSON.stringify(upsertPayload, null, 2))

    // Upsert the user profile
    const { error } = await supabase.from('profiles').upsert(upsertPayload, { onConflict: 'clerk_user_id' })

    if (error) {
      console.error(`Error upserting profile for user ${clerkUserId}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log(`Profile synced for ${clerkUserId} with role: ${upsertPayload.role || 'not set'}`)
  }
  
  if (eventType === 'user.deleted') {
    const { id: clerkUserId } = evt.data
    const supabase = createServerSupabaseClient()

    // Soft delete/deactivate (by setting a deleted_at or similar, or just leave it)
    // For now we'll just log or you can add a deactivated_at column in the future
    console.log(`User ${clerkUserId} deleted in Clerk`)
  }

  return new Response('', { status: 200 })
}
