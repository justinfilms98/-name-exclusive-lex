// =====================================================
// NEXTAUTH API ROUTE
// Handles NextAuth.js authentication requests
// =====================================================

import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 