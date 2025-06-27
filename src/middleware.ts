import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession();

  const isAuthRoute = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/auth/callback');

  // If the user is signed in and they are on an auth route, redirect them to the account page
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/account', req.url))
  }

  // If the user is not signed in and they are on a protected route, redirect them to the login page
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/account') || req.nextUrl.pathname.startsWith('/admin');
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // For admin routes, check if user has admin role
  if (session && req.nextUrl.pathname.startsWith('/admin')) {
    try {
      // Get user role from the users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !userData || userData.role !== 'admin') {
        // User is not an admin, redirect to unauthorized page
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    } catch (error) {
      // Error fetching user role, redirect to unauthorized page
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 