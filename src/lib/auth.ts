import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import type { AuthOptions as NextAuthOptions } from "next-auth/core/types";
import { prisma } from "@/lib/prisma";

// Export a function that returns authOptions to prevent build-time instantiation
export function getAuthOptions(): NextAuthOptions {
  return {
    adapter: PrismaAdapter(prisma),
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
      error: "/auth/error",
    },
    callbacks: {
      async signIn({ user, account, profile }) {
        // Always allow sign-in for Google accounts
        if (account?.provider === 'google') {
          return true;
        }
        return true;
      },
      async session({ session, user }) {
        if (session.user && user) {
          (session.user as any).id = user.id;
          session.user.email = user.email;
          (session.user as any).role = (user as any).role || 'user';
        }
        return session;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
  };
} 