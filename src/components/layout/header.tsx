'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, ShoppingCart, LogOut, Settings } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { status, data: session } = useSession();
  const isCreator = session?.user?.role === 'CREATOR';

  useEffect(() => {
    console.log('Session status:', status)
    console.log('Session data:', session)
    console.log('Is creator:', isCreator)
  }, [status, session, isCreator])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/collections" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-xl">
              Collections
            </Link>
            <Link href="/vip" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-xl">
              VIP
            </Link>
            {isCreator && (
              <Link href="/admin" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-xl flex items-center cursor-pointer">
                <Settings className="h-5 w-5 mr-1" />
                Admin
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#2E4A2E]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo as Home Link - Centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="text-[#2E4A2E] text-4xl font-serif font-bold hover:text-[#4A7A4A] transition-colors">
              Exclusive Lex
            </Link>
          </div>

          {/* Auth Buttons and Cart */}
          <div className="flex items-center space-x-4">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="text-[#2E4A2E] hover:text-[#4A7A4A]">
                <ShoppingCart className="h-8 w-8" />
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
            {status !== 'authenticated' ? (
              <>
                <Link href="/login">
                  <Button variant="outline" className="text-[#2E4A2E] border-[#2E4A2E] hover:bg-[#2E4A2E] hover:text-[#F2E8D5] text-xl">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-[#4A7A4A] hover:bg-[#2E4A2E] text-xl">
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/account">
                  <Button className="bg-[#4A7A4A] hover:bg-[#2E4A2E] text-xl">
                    My Account
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-[#2E4A2E] hover:text-[#4A7A4A]"
                >
                  <LogOut className="h-6 w-6" />
                  <span className="sr-only">Sign Out</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`${isMenuOpen ? 'flex' : 'hidden'} md:hidden flex-col absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 space-y-4`}>
          <Link href="/collections" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-xl">
            Collections
          </Link>
          <Link href="/vip" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-xl">
            VIP
          </Link>
          {isCreator && (
            <Link href="/admin" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-xl flex items-center cursor-pointer">
              <Settings className="h-5 w-5 mr-1" />
              Admin
            </Link>
          )}
          {status === 'authenticated' && (
            <>
              <Link href="/account" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-xl">
                My Account
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-[#2E4A2E] hover:text-[#4A7A4A] text-xl flex items-center"
              >
                <LogOut className="h-6 w-6 mr-2" />
                Sign Out
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
} 