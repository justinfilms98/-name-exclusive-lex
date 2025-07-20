"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, signInWithGoogle, signOut } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';

export default function HeaderClient() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {loading ? (
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
      ) : user ? (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">
            {user.email}
          </span>
          
          {isAdmin(user.email) && (
            <Link
              href="/admin"
              className="text-sm bg-stone-800 text-white px-3 py-1 rounded hover:bg-stone-900 transition-colors"
            >
              Admin
            </Link>
          )}
          
          <Link
            href="/account"
            className="text-sm text-stone-700 hover:text-stone-900"
          >
            Account
          </Link>
          
          <button
            onClick={handleSignOut}
            className="text-sm border border-stone-300 text-stone-700 px-3 py-1 rounded hover:bg-stone-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          className="text-sm bg-stone-800 text-white px-4 py-2 rounded hover:bg-stone-900 transition-colors"
        >
          Sign In with Google
        </button>
      )}
    </div>
  );
} 