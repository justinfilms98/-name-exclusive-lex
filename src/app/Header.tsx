"use client";
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const isAdmin = (session?.user as any)?.role?.toLowerCase() === 'admin';

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-center items-center bg-blue-100 bg-opacity-90 py-1 m-0 shadow-md" style={{backdropFilter: 'blur(6px)'}}>
      <nav className="flex gap-4 items-center">
        <Link href="/collections" className="text-green-900 font-semibold hover:underline px-2 py-1">Collections</Link>
        <Link href="/vip" className="text-green-900 font-semibold hover:underline px-2 py-1">VIP</Link>
        <Link href="/" className="text-green-900 font-bold text-xl hover:underline px-2 py-1">Exclusive Lex</Link>
        <Link href="/cart" className="text-green-900 hover:underline px-2 py-1">🛒</Link>
        {isLoggedIn ? (
          <Link href="/account">
            <button className="bg-green-900 text-white px-3 py-1 rounded text-sm">My Account</button>
          </Link>
        ) : (
          <button onClick={() => signIn()} className="bg-green-900 text-white px-3 py-1 rounded text-sm">Login</button>
        )}
      </nav>
    </header>
  );
} 