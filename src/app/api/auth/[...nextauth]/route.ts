// Use the shared auth configuration from lib/auth.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Add debug logging
console.log('NextAuth route handler initialized')

// Export the handler using the shared auth configuration
const handler = NextAuth(authOptions)

// Export the handler for both GET and POST methods
export const GET = async (req: Request) => {
  console.log('NextAuth GET request received:', req.url)
  return handler(req)
}

export const POST = async (req: Request) => {
  console.log('NextAuth POST request received:', req.url)
  return handler(req)
}

// This is important for the App Router
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' 