"use client";
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { CartPreview } from "@/components/CartPreview";

export default function Header() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const isAdmin = (session?.user as any)?.role?.toLowerCase() === 'admin';
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur border-b border-[#654C37]/10 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold font-serif" style={{ color: '#654C37' }}>
            exclusive lex
          </span>
        </Link>
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/collections" className="text-lg font-semibold transition-colors hover:text-[#654C37]" style={{ color: '#654C37' }}>
            Collections
          </Link>
          {/* ...other nav items... */}
        </nav>
        {/* Hamburger Menu for Mobile */}
        <div className="md:hidden flex items-center">
          <button
            aria-label="Open menu"
            className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#654C37]"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {/* Hamburger Icon */}
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#654C37" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {/* Right: Cart and Account/Login */}
        <div className="flex items-center gap-4">
          <CartPreview />
          <Link href="/cart" className="text-[#D4C7B4] hover:underline px-2 py-1 link-underline">🛒</Link>
          {isLoggedIn ? (
            <Link href="/account">
              <button className="bg-[#D4C7B4] text-[#654C37] px-3 py-1 rounded text-sm button-animate">My Account</button>
            </Link>
          ) : (
            <button onClick={() => signIn()} className="bg-[#D4C7B4] text-[#654C37] px-3 py-1 rounded text-sm button-animate">Login</button>
          )}
        </div>
        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="absolute top-12 left-2 right-2 bg-white rounded shadow-lg flex flex-col items-stretch z-50 sm:hidden animate-fade-slide">
            <Link href="/collections" className="text-[#654C37] font-semibold hover:underline px-4 py-3 border-b border-gray-200 link-underline" onClick={() => setMenuOpen(false)}>Collections</Link>
            <Link href="/cart" className="text-[#654C37] hover:underline px-4 py-3 border-b border-gray-200 link-underline" onClick={() => setMenuOpen(false)}>Cart</Link>
            {isLoggedIn ? (
              <Link href="/account" className="px-4 py-3" onClick={() => setMenuOpen(false)}>
                <button className="w-full bg-[#D4C7B4] text-[#654C37] px-3 py-2 rounded text-sm button-animate">My Account</button>
              </Link>
            ) : (
              <button onClick={() => { setMenuOpen(false); signIn(); }} className="w-full bg-[#D4C7B4] text-[#654C37] px-3 py-2 rounded text-sm m-2 button-animate">Login</button>
            )}
          </div>
        )}
      </div>
    </header>
  );
} 