import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '@/lib/prisma'
import type { SessionStrategy } from 'next-auth'

const authOptions = {
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
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, user }: any) {
      if (session?.user) {
        session.user.id = user.id
        session.user.role = user.role
      }
      return session
    },
    async jwt({ token, user, account }: any) {
      if (account && user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          accessToken: account.access_token,
        }
      }
      return token
    }
  },
  session: {
    strategy: 'jwt' as SessionStrategy,
  },
  debug: process.env.NODE_ENV === 'development',
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'creator') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    const id = params.id
    const { title, description, price, type } = await req.json()
    const updated = await prisma.video.update({
      where: { id },
      data: { title, description, price: parseFloat(price), type },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating video:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 