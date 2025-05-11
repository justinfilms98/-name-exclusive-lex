'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ShoppingCart, User, Home } from 'lucide-react'

export function MobileNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-50 text-[#2E4A2E]"
      >
        <svg
          className="w-10 h-10"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12"></path>
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16"></path>
          )}
        </svg>
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <Link 
              href="/" 
              onClick={() => setIsOpen(false)}
              className={`font-medium flex items-center space-x-2 text-xl ${
                pathname === '/' 
                  ? 'text-[#2E4A2E]' 
                  : 'text-[#2E4A2E] hover:text-[#4A7A4A]'
              }`}
            >
              <Home className="w-8 h-8" />
              <span>Home</span>
            </Link>
            <Link 
              href="/cart" 
              onClick={() => setIsOpen(false)}
              className={`font-medium flex items-center space-x-2 text-xl ${
                pathname === '/cart' 
                  ? 'text-[#2E4A2E]' 
                  : 'text-[#2E4A2E] hover:text-[#4A7A4A]'
              }`}
            >
              <ShoppingCart className="w-8 h-8" />
              <span>Cart</span>
            </Link>
            <Link 
              href="/account" 
              onClick={() => setIsOpen(false)}
              className={`font-medium flex items-center space-x-2 text-xl ${
                pathname === '/account' 
                  ? 'text-[#2E4A2E]' 
                  : 'text-[#2E4A2E] hover:text-[#4A7A4A]'
              }`}
            >
              <User className="w-8 h-8" />
              <span>Account</span>
            </Link>
            <Button className="bg-[#2E4A2E] text-[#F2E8D5] hover:bg-[#3C2F2F] text-xl">
              Subscribe Now
            </Button>
          </div>
        </div>
      )}
    </>
  )
} 