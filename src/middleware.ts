import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("NEXTAUTH_SECRET is not set.");
    // In a real scenario, you might want to return an error response
    return NextResponse.next(); 
  }

  const token = await getToken({ req, secret, raw: true });
  const isAuthenticated = !!token;
  
  // Attempt to get user role from the token
  let userRole: string | null = null;
  if (isAuthenticated) {
    try {
      const decodedToken = await getToken({ req, secret });
      if (decodedToken && typeof decodedToken.role === 'string') {
        userRole = decodedToken.role;
      }
    } catch (e) {
      console.error("Error decoding token:", e);
    }
  }

  const { pathname } = req.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ['/account', '/cart', '/watch', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !isAuthenticated) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/signin';
    redirectUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle admin route authorization
  if (pathname.startsWith('/admin')) {
    const isAdmin = userRole === 'admin';
    if (!isAdmin) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/unauthorized';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If accessing signin page while already authenticated, redirect to account
  if (pathname === '/signin' && isAuthenticated) {
    return NextResponse.redirect(new URL('/account', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 