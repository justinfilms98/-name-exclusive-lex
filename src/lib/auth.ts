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
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      }),
    ],
    session: {
      strategy: "database",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
      signIn: "/login",
      error: "/auth/error",
    },
    callbacks: {
      async signIn({ user, account, profile, email, credentials }) {
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
      async jwt({ token, user, account }) {
        if (user) {
          token.sub = user.id;
          token.email = user.email;
          token.role = (user as any).role || 'user';
        }
        return token;
      },
    },
    events: {
      async signIn({ user, account, profile }) {
        console.log(`User signed in: ${user.email}`);
      },
      async signOut({ session, token }) {
        console.log(`User signed out`);
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
  };
} 