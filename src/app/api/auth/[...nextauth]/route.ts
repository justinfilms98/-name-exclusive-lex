// =====================================================
// NEXTAUTH API ROUTE
// Handles NextAuth.js authentication requests
// =====================================================

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

export const authOptions = {
  // ... existing providers and settings ...
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      return session;
    },
    async jwt({ token, account }) {
      if (account?.providerAccountId) token.sub = account.providerAccountId;
      return token;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 