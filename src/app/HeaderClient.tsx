"use client";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CartPreview } from '@/components/CartPreview';

export default function HeaderClient() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // Initial check
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="text-xl font-bold text-stone-800">
        <Link href="/">EXCLUSIVE LEX</Link>
      </div>
      <nav className="flex items-center gap-4">
        <Link href="/collections" className="text-stone-600 hover:text-stone-900 transition-colors">Collections</Link>
        {user ? (
          <>
            <Link href="/account" className="text-stone-600 hover:text-stone-900 transition-colors">My Account</Link>
            <button onClick={handleSignOut} className="bg-stone-800 text-white px-3 py-1 rounded-md text-sm hover:bg-stone-900 transition-colors">
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/signin">
            <button className="bg-stone-800 text-white px-3 py-1 rounded-md text-sm hover:bg-stone-900 transition-colors">
              Login
            </button>
          </Link>
        )}
      </nav>
    </div>
  );
} 