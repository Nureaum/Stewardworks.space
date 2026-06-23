import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && sessionData?.session) {
      // Check if this user already completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', sessionData.session.user.id)
        .single()

      if (profile && profile.full_name) {
        // Returning user - go straight to Hub
        return NextResponse.redirect(`${origin}/hub`)
      } else {
        // New user - go to Onboarding
        return NextResponse.redirect(`${origin}/onboarding/language`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth`)
}
