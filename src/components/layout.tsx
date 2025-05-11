'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { signIn, signOut, useSession } from 'next-auth/react'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-white">
              Your Logo
            </Link>
            <div className="flex items-center gap-4">
              {!session && (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-white hover:text-white/80">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="outline" className="border-white text-white hover:bg-white/10">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
              <Link href="/pricing">
                <Button className="bg-white text-gray-900 hover:bg-white/90">
                  Subscribe Now
                </Button>
              </Link>
              {session ? (
                <>
                  <Link href="/account">
                    <Button variant="ghost" className="text-white hover:text-white/80">
                      Account
                    </Button>
                  </Link>
                  <Link href="/admin/analytics">
                    <Button variant="ghost" className="text-white hover:text-white/80">
                      Analytics
                    </Button>
                  </Link>
                  <Link href="/admin/upload">
                    <Button variant="ghost" className="text-white hover:text-white/80">
                      Upload
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => signOut()}
                    className="text-white hover:text-white/80"
                  >
                    Sign Out
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </nav>
      </header>
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}

export default Layout 