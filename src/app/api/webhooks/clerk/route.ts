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
    const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data
    const email = email_addresses[0]?.email_address
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || ''

    const supabase = createServerSupabaseClient()

    // Upsert the user profile
    const { error } = await supabase.from('profiles').upsert({
      clerk_user_id: clerkUserId,
      email: email,
      full_name: fullName,
      // We don't set 'role' here by default on upsert because it defaults to 'participant' in DB
      // and we don't want to overwrite an admin role on 'user.updated'
      updated_at: new Date().toISOString(),
    }, { onConflict: 'clerk_user_id' })

    if (error) {
      console.error(`Error upserting profile for user ${clerkUserId}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log(`Profile synced for ${clerkUserId}`)
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
