'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="absolute top-0 left-0 w-full bg-transparent py-8 z-20">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        {/* Left side navigation */}
        <div className="flex space-x-8">
          <Link href="/collections" className="font-serif font-bold text-[#F2E8D5] uppercase tracking-wide text-base">
            Collections
          </Link>
          <Link href="/pricing" className="font-serif font-bold text-[#F2E8D5] uppercase tracking-wide text-base">
            Pricing
          </Link>
        </div>

        {/* Center logo */}
        <Link 
          href="/" 
          className="absolute left-1/2 transform -translate-x-1/2 font-serif font-bold text-2xl text-[#F2E8D5] hover:text-[#E8D4C6] transition-colors"
        >
          Exclusive Lex
        </Link>

        {/* Right side - Cart and Subscribe */}
        <div className="flex items-center space-x-6">
          <Link 
            href="/cart" 
            className="text-[#F2E8D5] hover:text-[#E8D4C6] transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
          </Link>
          <Link href="/vip">
            <Button className="bg-[#2E4A2E] text-[#F2E8D5] hover:bg-[#3C2F2F]">
              Subscribe Now
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
} 