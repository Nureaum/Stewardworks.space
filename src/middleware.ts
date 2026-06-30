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
  '/onboarding/bulletin(.*)',
  '/api(.*)',
  '/fonts(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/admin/pilot-workshops(.*)'
])


/**
 * VIP routes that require onboarding completion (preferred_language set).
 * REMOVED: pilot-workshops, community-listening, and ai-lab from VIP routes
 * Users can VIEW these pages without onboarding
 * Individual workshop pages and AI Lab module access require onboarding (handled in components)
 */
const isVipRoute = createRouteMatcher([
  // Empty - all /hub routes are now accessible for viewing
  // Onboarding checks are handled within individual components
])

export default clerkMiddleware(async (auth, request) => {
  // CRITICAL FIX: Get auth state without redirecting yet
  const authResult = await auth();
  const { userId } = authResult;

  // CRITICAL: Skip auth checks for verify page to allow session activation
  if (request.nextUrl.pathname.startsWith('/verify')) {
    return NextResponse.next();
  }

  // Protect non-public routes
  if (!isPublicRoute(request) && !isAdminRoute(request)) {
    if (!userId) {
      const signInUrl = new URL('/login', request.url);
      // CRITICAL: Add returnUrl so user can come back after login
      signInUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Admin route check
  if (isAdminRoute(request)) {
    if (!userId) {
      const signInUrl = new URL('/login', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(signInUrl);
    }
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('clerk_user_id', userId)
        .single()
        
      const role = profile?.role;
      if (role !== 'admin' && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }

    } catch (error) {
      console.error('Middleware admin check failed:', error);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // VIP route check: user must have completed the onboarding questionnaire
  if (userId && isVipRoute(request)) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('clerk_user_id', userId)
        .single()

      if (!profile || !profile.preferred_language) {
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding/language';
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // If DB check fails, allow access rather than blocking
      console.error('Middleware VIP check failed:', error);
    }
  }

  // CRITICAL FIX: Return NextResponse.next() to continue processing
  return NextResponse.next();
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
