import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import type { AuthOptions as NextAuthOptions } from "next-auth/core/types";

// Lazy adapter initialization
let _adapter: any = null;
function getAdapter() {
  if (!_adapter) {
    const { prisma } = require('@/lib/prisma');
    _adapter = PrismaAdapter(prisma());
  }
  return _adapter;
}

export const authOptions: NextAuthOptions = {
  adapter: getAdapter(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.email = (user as any).email;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).email = token.email as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Runtime type check guards for Google Auth callback
      if (!profile?.sub || !account?.provider) {
        console.error('Missing OAuth providerAccountId or provider in callback:', { profile, account });
        throw new Error('Missing OAuth providerAccountId or provider in callback.');
      }

      // Additional safety checks
      if (!user?.email) {
        console.error('Missing user email in callback:', user);
        throw new Error('Missing user email in callback.');
      }

      // TEMP: Allow all users to sign in for now
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
} 