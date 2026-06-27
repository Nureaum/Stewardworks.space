import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Public routes that don't require authentication.
 * All other routes are protected by Clerk.
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/verify(.*)',
  '/info(.*)',
  '/admin(.*)',
  '/onboarding/bulletin(.*)',
  '/api(.*)',
])

/**
 * VIP routes that require onboarding completion (preferred_language set).
 */
const isVipRoute = createRouteMatcher([
  '/hub/pilot-workshops(.*)',
  '/hub/community-listening(.*)',
  '/hub/ai-lab(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Protect non-public routes
  if (!isPublicRoute(request)) {
    const { userId } = await auth()
    if (!userId) {
      const signInUrl = new URL('/login', request.url)
      return NextResponse.redirect(signInUrl)
    }
  }

  // VIP route check: user must have completed the onboarding questionnaire
  const { userId } = await auth()
  if (userId && isVipRoute(request)) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', userId)
        .single()

      if (!profile || !profile.preferred_language) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding/language'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // If DB check fails, allow access rather than blocking
      console.error('Middleware VIP check failed:', error)
    }
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
