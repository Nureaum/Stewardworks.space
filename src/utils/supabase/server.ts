import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client using the service role key.
 * This client bypasses RLS and should ONLY be used in server-side code
 * (API routes, middleware, server components).
 *
 * NEVER expose this client or the service role key to the browser.
 */
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
