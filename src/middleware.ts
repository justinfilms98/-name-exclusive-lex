import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession();

  const isAuthRoute = req.nextUrl.pathname.startsWith('/signin') || req.nextUrl.pathname.startsWith('/auth/callback');

  // If the user is signed in and they are on an auth route, redirect them to the home page
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // If the user is not signed in and they are on a protected route, redirect them to the sign-in page
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/account') || req.nextUrl.pathname.startsWith('/admin');
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/signin', req.url))
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