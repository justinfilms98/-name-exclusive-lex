"use client";
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { CartPreview } from '@/components/CartPreview';

export default function Header() {
  const sessionHook = typeof useSession === 'function' ? useSession() : undefined;
  const session = sessionHook?.data;
  const status = sessionHook?.status;
  return (
    <header className="bg-white dark:bg-stone-900 shadow-sm border-b border-stone-200 dark:border-stone-800 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <nav className="flex items-center space-x-8">
            <Link href="/collections" className="text-stone-600 dark:text-stone-200 hover:text-stone-800 dark:hover:text-white transition-colors font-medium">
              Collections
            </Link>
          </nav>
          <div className="flex-1 flex justify-center">
            <Link href="/" className="text-2xl font-serif text-stone-800 dark:text-white font-bold tracking-wide">
              Exclusive Lex
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <CartPreview />
            {status === 'loading' ? null : session ? (
              <>
                <Link href="/account" className="text-stone-600 dark:text-stone-200 hover:text-stone-800 dark:hover:text-white transition-colors font-medium">My Account</Link>
                <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-stone-600 dark:text-stone-200 hover:text-stone-800 dark:hover:text-white transition-colors font-medium">Sign Out</button>
              </>
            ) : (
              <Link href="/login" className="bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 px-4 py-2 rounded-md hover:bg-stone-900 dark:hover:bg-white transition-colors font-medium">Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 