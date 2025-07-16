"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { CartPreview } from '@/components/CartPreview';

export default function HeaderClient() {
  const sessionHook = typeof useSession === 'function' ? useSession() : undefined;
  const session = sessionHook?.data;
  const status = sessionHook?.status;
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status !== 'loading') {
      setLoading(false);
    }
  }, [status]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b border-stone-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-serif text-stone-800">
                Exclusive Lex
              </Link>
            </div>
            <div className="animate-pulse bg-stone-200 h-8 w-24 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b border-stone-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-serif text-stone-800">
              Exclusive Lex
            </Link>
          </div>
          
          <nav className="flex items-center space-x-8">
            <Link href="/collections" className="text-stone-600 hover:text-stone-800 transition-colors">
              Collections
            </Link>
            <CartPreview />
            
            {session && session.user ? (
              <>
                {/* Temporarily removed admin check for testing */}
                <Link href="/admin" className="text-stone-600 hover:text-stone-800 transition-colors">
                  Admin
                </Link>
                <Link href="/account" className="text-stone-600 hover:text-stone-800 transition-colors">
                  Account
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-stone-600 hover:text-stone-800 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link 
                href="/login"
                className="bg-stone-800 text-white px-4 py-2 rounded-md hover:bg-stone-900 transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
} 