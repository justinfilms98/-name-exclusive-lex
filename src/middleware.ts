import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Middleware is kept minimal - client-side pages handle entry access checks
  // This allows for better UX and avoids blocking API routes
  // Entry access enforcement is handled in:
  // - src/app/collections/page.tsx
  // - src/app/albums/page.tsx
  // - src/app/cart/page.tsx
  // - And other protected pages
  
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
