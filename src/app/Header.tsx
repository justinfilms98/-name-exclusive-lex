"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = !!session;
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  return (
    <header className="w-full px-4 py-4 bg-transparent">
      <div className="flex flex-col md:flex-row items-center justify-center md:justify-between max-w-6xl mx-auto">
        <div className="flex-1 flex justify-center md:justify-center mb-2 md:mb-0">
          <Link href="/" className="text-2xl font-bold text-green-900">Exclusive Lex</Link>
        </div>
        <nav className="flex items-center gap-6 justify-center">
          <Link href="/collections" className="text-green-900 font-semibold hover:underline">Collections</Link>
          <Link href="/vip" className="text-green-900 font-semibold hover:underline">VIP</Link>
          {isAdmin && <Link href="/admin" className="text-green-900 font-semibold hover:underline">Admin</Link>}
        </nav>
        <div className="flex items-center gap-4 justify-center mt-2 md:mt-0">
          <Link href="/cart" className="text-green-900 hover:underline">🛒</Link>
          {isLoggedIn ? (
            <>
              <Link href="/account">
                <button className="bg-green-900 text-white px-4 py-1 rounded">My Account</button>
              </Link>
              <button onClick={() => signOut()} className="bg-red-600 text-white px-4 py-1 rounded">Logout</button>
            </>
          ) : (
            <button onClick={() => signIn()} className="bg-green-900 text-white px-4 py-1 rounded">Login</button>
          )}
        </div>
      </div>
      {/* Mobile nav menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-4 items-center bg-white rounded shadow p-4">
          <Link href="/collections" className="text-green-900 font-semibold hover:underline w-full text-center" onClick={() => setMenuOpen(false)}>Collections</Link>
          <Link href="/vip" className="text-green-900 font-semibold hover:underline w-full text-center" onClick={() => setMenuOpen(false)}>VIP</Link>
          {isAdmin && <Link href="/admin" className="text-green-900 font-semibold hover:underline w-full text-center" onClick={() => setMenuOpen(false)}>Admin</Link>}
          <Link href="/cart" className="text-green-900 hover:underline w-full text-center" onClick={() => setMenuOpen(false)}>🛒 Cart</Link>
          {isLoggedIn ? (
            <>
              <Link href="/account" className="w-full text-center" onClick={() => setMenuOpen(false)}>
                <button className="bg-green-900 text-white px-4 py-1 rounded w-full">My Account</button>
              </Link>
              <button onClick={() => { setMenuOpen(false); signOut(); }} className="bg-red-600 text-white px-4 py-1 rounded w-full">Logout</button>
            </>
          ) : (
            <button onClick={() => { setMenuOpen(false); signIn(); }} className="bg-green-900 text-white px-4 py-1 rounded w-full">Login</button>
          )}
        </div>
      )}
    </header>
  );
} 