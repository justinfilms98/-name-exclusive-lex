// Use the shared auth configuration from lib/auth.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Export the handler using the shared auth configuration
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 