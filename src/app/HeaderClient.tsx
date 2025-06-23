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
    });

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
      <div className="flex-shrink-0">
        <Link href="/" className="text-2xl font-bold font-serif uppercase tracking-widest text-stone-800">
          EXCLUSIVE LEX
        </Link>
      </div>
      <div className="flex items-center gap-6">
        <Link href="/collections" className="text-stone-600 hover:text-stone-900 transition-colors">
          Collections
        </Link>
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
            <Link href="/signin">
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