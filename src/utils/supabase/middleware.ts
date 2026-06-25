import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Level 2 (Basic): Protect all /hub and /onboarding pages EXCEPT /onboarding/bulletin
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/hub') || 
    (request.nextUrl.pathname.startsWith('/onboarding') && !request.nextUrl.pathname.startsWith('/onboarding/bulletin'))

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Level 3 (VIP): Must have completed the onboarding questionnaire
  const isVipRoute = 
    request.nextUrl.pathname.startsWith('/hub/pilot-workshops') ||
    request.nextUrl.pathname.startsWith('/hub/community-listening') ||
    request.nextUrl.pathname.startsWith('/hub/ai-lab')

  if (user && isVipRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.preferred_language) {
      // User hasn't finished the questionnaire, force them to do it
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/language'
      return NextResponse.redirect(url)
    }
  }

  return response
}
