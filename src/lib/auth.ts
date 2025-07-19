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
    async signIn(params: any) {
      const { user, account } = params;
      if (account?.provider === 'google') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Create a new user if not existing
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name!,
                role: 'user',
              },
            });
            console.log('Created new user:', user.email);
          }
          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return true; // Still allow sign in even if user creation fails
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }: any) {
      console.log('Redirect callback - url:', url, 'baseUrl:', baseUrl);
      
      // If redirecting from login success, go to home page
      if (url.includes('/api/auth/callback')) {
        return baseUrl;
      }
      
      // If the URL is relative, prepend baseUrl
      if (url.startsWith('/')) {
        return baseUrl + url;
      }
      
      // If the URL is on the same origin, allow it
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Otherwise, redirect to home
      return baseUrl;
    },
    async session({ session, user }: any) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = user.role || 'user';
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

export function getAuthOptions() {
  return authOptions
} 