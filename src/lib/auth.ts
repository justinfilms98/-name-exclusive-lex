import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import type { SessionStrategy } from "next-auth";
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import type { User, Account, Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

// List of admin/creator emails
const ADMIN_EMAILS = [
  'contact.exclusivelex@gmail.com'
]

export const authOptions = {
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
    })
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }: { user: User; account: Account | null }) {
      if (account?.provider === 'google' && user.email) {
        console.log('Sign in attempt for:', user.email)
        const isAdmin = ADMIN_EMAILS.includes(user.email)
        console.log('Is admin?', isAdmin)
        
        try {
          const updatedUser = await prisma.user.update({
            where: { email: user.email },
            data: { role: isAdmin ? 'CREATOR' : 'USER' }
          })
          console.log('Updated user role:', updatedUser.role)
        } catch (error) {
          console.error('Error updating user role:', error)
        }
      }
      return true
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
      }
      
      // Always check and update role from database
      if (token.email) {
        const dbUser = await prisma.user.findFirst({
          where: { email: token.email.toLowerCase() }
        });
        console.log('JWT callback dbUser:', dbUser);
        
        // If user exists in DB, use their role
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id;
        } 
        // If user doesn't exist but is in ADMIN_EMAILS, set role to CREATOR
        else if (ADMIN_EMAILS.includes(token.email)) {
          token.role = 'CREATOR';
        }
        // Otherwise set to USER
        else {
          token.role = 'USER';
        }
      }
      
      console.log('Final JWT token:', token);
      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export async function isAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'CREATOR'
}

export async function requireAdmin() {
  const isAdminUser = await isAdmin()
  if (!isAdminUser) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  return null
} 