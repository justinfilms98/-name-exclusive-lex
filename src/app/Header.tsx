"use client";
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Header() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const isAdmin = (session?.user as any)?.role?.toLowerCase() === 'admin';
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-blue-100 bg-opacity-90 py-1 m-0 shadow-md" style={{backdropFilter: 'blur(6px)'}}>
      <div className="flex flex-col items-center w-full">
        {/* Centered Title */}
        <Link href="/" className="text-green-900 font-bold text-xl hover:underline py-1 link-underline whitespace-nowrap">Exclusive Lex</Link>
        {/* Nav Row */}
        <nav className="flex items-center w-full justify-between px-4 mt-1">
          {/* Left: Hamburger (mobile) or Collections (desktop) */}
          <div className="flex items-center">
            <button
              className="sm:hidden ml-2 p-2 focus:outline-none button-animate"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Open menu"
            >
              <svg className="w-6 h-6 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <Link href="/collections" className="text-green-900 font-semibold hover:underline px-2 py-1 hidden sm:inline sm:ml-0 ml-4 link-underline">Collections</Link>
          </div>
          {/* Right: Cart and Account/Login */}
          <div className="flex items-center gap-4">
            <Link href="/cart" className="text-green-900 hover:underline px-2 py-1 link-underline">🛒</Link>
            {isLoggedIn ? (
              <Link href="/account">
                <button className="bg-green-900 text-white px-3 py-1 rounded text-sm button-animate">My Account</button>
              </Link>
            ) : (
              <button onClick={() => signIn()} className="bg-green-900 text-white px-3 py-1 rounded text-sm button-animate">Login</button>
            )}
          </div>
          {/* Mobile dropdown menu */}
          {menuOpen && (
            <div className="absolute top-12 left-2 right-2 bg-white rounded shadow-lg flex flex-col items-stretch z-50 sm:hidden animate-fade-slide">
              <Link href="/collections" className="text-green-900 font-semibold hover:underline px-4 py-3 border-b border-gray-200 link-underline" onClick={() => setMenuOpen(false)}>Collections</Link>
              <Link href="/cart" className="text-green-900 hover:underline px-4 py-3 border-b border-gray-200 link-underline" onClick={() => setMenuOpen(false)}>Cart</Link>
              {isLoggedIn ? (
                <Link href="/account" className="px-4 py-3" onClick={() => setMenuOpen(false)}>
                  <button className="w-full bg-green-900 text-white px-3 py-2 rounded text-sm button-animate">My Account</button>
                </Link>
              ) : (
                <button onClick={() => { setMenuOpen(false); signIn(); }} className="w-full bg-green-900 text-white px-3 py-2 rounded text-sm m-2 button-animate">Login</button>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
} 