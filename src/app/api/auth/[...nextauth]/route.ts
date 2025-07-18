// =====================================================
// NEXTAUTH API ROUTE
// Handles NextAuth.js authentication requests
// =====================================================

import NextAuth from "next-auth/next";
import { getAuthOptions } from "@/lib/auth";

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// Lazy handler creation to prevent build-time execution
let _handler: any = null;

function getHandler() {
  if (!_handler) {
    _handler = NextAuth(getAuthOptions());
  }
  return _handler;
}

export async function GET(request: Request) {
  return getHandler().GET(request);
}

export async function POST(request: Request) {
  return getHandler().POST(request);
} 