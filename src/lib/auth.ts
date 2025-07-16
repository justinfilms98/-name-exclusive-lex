import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
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
  },
  callbacks: {
    async session({ session, user }) {
      // Ensure user ID gets added to session object
      if (session.user) {
        session.user.id = user.id
        session.user.email = user.email
      }
      return session
    },
    async signIn({ user }) {
      // TEMP: Allow all users to sign in for now
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
} 