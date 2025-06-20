"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function HeaderClient({ user }: { user: User | null }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = !!user;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleSignIn = () => {
    router.push('/signin');
  };
  
  return (
    <>
      {/* Hamburger Menu for Mobile & Desktop Collections Link */}
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
      <nav className="hidden md:flex items-center min-w-[120px]">
        <Link href="/collections" className="text-lg font-semibold transition-colors hover:text-[#654C37]" style={{ color: '#654C37' }}>
          Collections
        </Link>
      </nav>
      
      {/* Right-side buttons for desktop */}
      <div className="hidden md:flex items-center gap-2">
        {isLoggedIn && (
            <button onClick={handleSignOut} className="bg-[#654C37] text-white px-3 py-1 rounded text-sm button-animate">Logout</button>
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
            <div className="px-4 py-3 space-y-2">
              <Link href="/account" className="block" onClick={() => setMenuOpen(false)}>
                <button className="w-full bg-[#D4C7B4] text-[#654C37] px-3 py-2 rounded text-sm button-animate">My Account</button>
              </Link>
              <button onClick={() => { setMenuOpen(false); handleSignOut(); }} className="w-full bg-[#654C37] text-white px-3 py-2 rounded text-sm button-animate">Logout</button>
            </div>
          ) : (
            <button onClick={() => { setMenuOpen(false); handleSignIn(); }} className="w-full bg-[#D4C7B4] text-[#654C37] px-3 py-2 rounded text-sm m-2 button-animate">Login</button>
          )}
        </div>
      )}
    </>
  );
} 