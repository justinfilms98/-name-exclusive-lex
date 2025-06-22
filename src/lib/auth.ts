import { createClient } from '@supabase/supabase-js';
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export function signOut() {
  return supabase.auth.signOut();
}

export function getUser() {
  return supabase.auth.getUser();
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        domain: '.exclusivelex.com',
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
      },
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub!;
        // Add any additional user data you want to include in the session
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        if (dbUser) {
          (session.user as any).role = dbUser.role;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin", // Error code passed in query string as ?error=
  },
};

export default supabase; 