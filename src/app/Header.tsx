"use client";
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { CartPreview } from "@/components/CartPreview";
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const isAdmin = (session?.user as any)?.role?.toLowerCase() === 'admin';
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur border-b border-[#654C37]/10 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative">
        {/* Hamburger Menu for Mobile (absolute left) */}
        <div className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <button
            aria-label="Open menu"
            className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#654C37]"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#654C37" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {/* Left: Collections tab (desktop only) */}
        <nav className="hidden md:flex items-center min-w-[120px]">
          <Link href="/collections" className="text-lg font-semibold transition-colors hover:text-[#654C37]" style={{ color: '#654C37' }}>
            Collections
          </Link>
        </nav>
        {/* Centered Logo / Brand (absolute center on mobile) */}
        <div className="flex-1 flex justify-center">
          <Link href="/" className="flex items-center gap-2 mx-auto">
            <span className="text-2xl font-bold font-serif uppercase tracking-widest" style={{ color: '#654C37', letterSpacing: '0.1em' }}>
              EXCLUSIVE LEX
            </span>
          </Link>
        </div>
        {/* Right: Cart, Account/Login (desktop only) */}
        <div className="hidden md:flex items-center gap-4">
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
            <Link href="/cart" className="flex items-center gap-2 text-[#654C37] hover:underline px-4 py-3 border-b border-gray-200 link-underline" onClick={() => setMenuOpen(false)}>
              <span role="img" aria-label="cart">🛒</span> Cart
            </Link>
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