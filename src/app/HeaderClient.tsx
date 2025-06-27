"use client";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function HeaderClient() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      router.refresh(); // Refresh the page to update server components
    });

    // Also get user on initial load
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-bold font-serif uppercase tracking-widest text-stone-800">
          EXCLUSIVE LEX
        </Link>
        <Link href="/collections" className="text-stone-600 hover:text-stone-900 transition-colors">
          Collections
        </Link>
      </div>
      <div className="flex items-center gap-6">
        {!loading && (
          user ? (
            <>
              <Link href="/account" className="text-stone-600 hover:text-stone-900 transition-colors">
                My Account
              </Link>
              <button onClick={handleSignOut} className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-stone-900 transition-colors">
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login">
              <button className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-stone-900 transition-colors">
                Login
              </button>
            </Link>
          )
        )}
      </div>
    </div>
  );
} 