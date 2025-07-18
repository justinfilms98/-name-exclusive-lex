// =====================================================
// NEXTAUTH API ROUTE
// Handles NextAuth.js authentication requests
// =====================================================

import NextAuth from "next-auth/next";
import { getAuthOptions } from "@/lib/auth";

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// Export handler functions directly without immediate execution
export async function GET(request: Request) {
  const handler = NextAuth(getAuthOptions());
  return handler(request);
}

export async function POST(request: Request) {
  const handler = NextAuth(getAuthOptions());
  return handler(request);
} 