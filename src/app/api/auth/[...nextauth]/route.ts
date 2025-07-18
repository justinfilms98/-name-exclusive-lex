// =====================================================
// NEXTAUTH API ROUTE
// Handles NextAuth.js authentication requests
// =====================================================

import NextAuth from "next-auth/next";
import { getAuthOptions } from "@/lib/auth";

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// Create a single handler instance
const handler = NextAuth(getAuthOptions());

// Export handler functions with proper error handling
export async function GET(request: Request) {
  try {
    return handler(request);
  } catch (error) {
    console.error('NextAuth GET error:', error);
    return new Response('Authentication error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return handler(request);
  } catch (error) {
    console.error('NextAuth POST error:', error);
    return new Response('Authentication error', { status: 500 });
  }
} 