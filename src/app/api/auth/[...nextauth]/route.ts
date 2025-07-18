import NextAuth from "next-auth/next";
import { getAuthOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

const handler = NextAuth(getAuthOptions());

// Simple export without complex error handling
export { handler as GET, handler as POST }; 