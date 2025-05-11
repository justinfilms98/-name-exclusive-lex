import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    console.log('Middleware token:', JSON.stringify(token, null, 2)) // Pretty print token
    
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
    
    if (isAdminRoute) {
      if (!token) {
        console.log('No token found, redirecting to login')
        return NextResponse.redirect(new URL('/login', req.url))
      }
      
      // Check for role in token
      const role = token.role
      console.log('User role (from token):', role)
      
      if (role !== 'CREATOR') {
        console.log('User is not a creator, redirecting to home')
        return NextResponse.redirect(new URL('/', req.url))
      }
      
      console.log('User is a creator, allowing access to admin')
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log('Authorized callback token:', JSON.stringify(token, null, 2)) // Pretty print token
        return !!token // Allow all authenticated users to pass through
      }
    },
  }
)

export const config = {
  matcher: ['/admin/:path*']
} 