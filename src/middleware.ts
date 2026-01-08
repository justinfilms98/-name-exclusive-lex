import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/auth';

// Create Supabase client for middleware (using service role for reliable auth checks)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function middleware(request: NextRequest) {
  // Protected routes that require entry access check
  const protectedRoutes = ['/collections', '/albums', '/cart'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Skip admin check for non-protected routes and API routes
  if (!isProtectedRoute || request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Try to get user from auth header (for API calls) or attempt cookie-based session check
  // If we can't determine the user, let the page handle it (client-side check)
  // This ensures we don't break the login flow
  
  if (supabase) {
    try {
      // Check auth header first (for API-style requests)
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        if (token) {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          
          // If we successfully got a user and they're an admin, bypass entry fee check
          if (user && !error && isAdminEmail(user.email)) {
            return NextResponse.next();
          }
        }
      }

      // Try to get session from cookies (Supabase stores session in cookies)
      // Look for Supabase auth cookies - they typically follow pattern: sb-<project-ref>-auth-token
      const cookies = request.cookies.getAll();
      const supabaseAuthCookie = cookies.find(cookie => 
        cookie.name.includes('sb-') && cookie.name.includes('auth-token')
      );

      if (supabaseAuthCookie?.value) {
        try {
          // Parse the cookie value (it's JSON-encoded)
          const sessionData = JSON.parse(supabaseAuthCookie.value);
          const accessToken = sessionData?.access_token;
          
          if (accessToken) {
            const { data: { user }, error } = await supabase.auth.getUser(accessToken);
            
            // If we successfully got a user and they're an admin, bypass entry fee check
            if (user && !error && isAdminEmail(user.email)) {
              return NextResponse.next();
            }
          }
        } catch (parseError) {
          // Cookie might not be JSON, or might be in different format
          // Let client-side pages handle it
        }
      }
    } catch (error) {
      // If we can't check auth in middleware, let client-side pages handle it
      // This ensures we don't break the login flow
      // Silently continue - pages will check entry access client-side
    }
  }

  // For all other cases, let client-side pages handle entry access checks
  // This maintains the existing behavior where pages check entry access
  // Admin bypass is also checked in each protected page's client-side code
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
