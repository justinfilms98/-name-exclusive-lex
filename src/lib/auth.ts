import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database" as const,
  },
  pages: {
    signIn: "/login",
    error: "/login?authError=true",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (existingUser) {
          return true;
        } else {
          // Create a new user if not existing
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
            },
          });
          return true;
        }
      }
      return true;
    },
    async session({ session, user }: any) {
      if (session.user && user) {
        session.user.id = user.id
        session.user.role = user.role || 'user'
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

export function getAuthOptions() {
  return authOptions
} 