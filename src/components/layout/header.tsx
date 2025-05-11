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
    <header className="z-50 bg-white/80 backdrop-blur-sm border-b border-[#E4E4E4]">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between relative">
          {/* Top Row: Logo and Hamburger */}
          <div className="flex items-center justify-between w-full md:w-auto">
            {/* Logo */}
            <Link href="/" className="text-[#2E4A2E] text-3xl font-serif font-bold hover:text-[#4A7A4A] transition-colors">
              Exclusive Lex
            </Link>
            {/* Hamburger */}
            <button
              className="md:hidden text-[#2E4A2E] ml-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/collections" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-lg">Collections</Link>
            <Link href="/vip" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-lg">VIP</Link>
            {isCreator && (
              <Link href="/admin" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-lg flex items-center cursor-pointer">
                <Settings className="h-5 w-5 mr-1" />Admin
              </Link>
            )}
          </div>
          {/* Desktop Auth/Cart */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="text-[#2E4A2E] hover:text-[#4A7A4A]">
                <ShoppingCart className="h-7 w-7" />
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
            {status !== 'authenticated' ? (
              <>
                <Link href="/login">
                  <Button variant="outline" className="text-[#2E4A2E] border-[#2E4A2E] hover:bg-[#2E4A2E] hover:text-[#F2E8D5] text-base">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-[#4A7A4A] hover:bg-[#2E4A2E] text-base">Sign Up</Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/account">
                  <Button className="bg-[#4A7A4A] hover:bg-[#2E4A2E] text-base">My Account</Button>
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
          {/* Mobile Menu */}
          <div className={`${isMenuOpen ? 'flex' : 'hidden'} md:hidden flex-col w-full mt-4 space-y-4 bg-white/95 rounded-lg shadow-lg p-4 z-50 absolute left-0 top-14`}>
            <Link href="/collections" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-lg">Collections</Link>
            <Link href="/vip" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-lg">VIP</Link>
            {isCreator && (
              <Link href="/admin" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-lg flex items-center cursor-pointer">
                <Settings className="h-5 w-5 mr-1" />Admin
              </Link>
            )}
            <Link href="/cart" className="flex items-center text-[#2E4A2E] hover:text-[#4A7A4A] text-lg">
              <ShoppingCart className="h-6 w-6 mr-2" />Cart
            </Link>
            {status !== 'authenticated' ? (
              <>
                <Link href="/login">
                  <Button variant="outline" className="w-full text-[#2E4A2E] border-[#2E4A2E] hover:bg-[#2E4A2E] hover:text-[#F2E8D5] text-base">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full bg-[#4A7A4A] hover:bg-[#2E4A2E] text-base">Sign Up</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/account" className="text-[#2E4A2E] hover:text-[#4A7A4A] text-lg">My Account</Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-[#2E4A2E] hover:text-[#4A7A4A] text-lg flex items-center mt-2"
                >
                  <LogOut className="h-6 w-6 mr-2" />Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
} 