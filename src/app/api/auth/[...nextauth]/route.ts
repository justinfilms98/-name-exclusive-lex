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

const handler = getHandler();
export { handler as GET, handler as POST }; 