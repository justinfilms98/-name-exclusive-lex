"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, signInWithGoogle, signOut } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';

export default function HeaderClient() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signInLoading, setSignInLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (err) {
        console.error('Session error:', err);
        setError('Failed to load user session');
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user || null);
        setLoading(false);
        setError(null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setSignInLoading(true);
    setError(null);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Sign in error:', error);
        setError('Failed to sign in. Please try again.');
      }
    } catch (err) {
      console.error('Sign in exception:', err);
      setError('Sign in failed. Please try again.');
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        setError('Failed to sign out. Please try again.');
      }
    } catch (err) {
      console.error('Sign out exception:', err);
      setError('Sign out failed. Please try again.');
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
        <div className="flex flex-col items-end space-y-2">
          <button
            onClick={handleSignIn}
            disabled={signInLoading}
            className="text-sm bg-stone-800 text-white px-4 py-2 rounded hover:bg-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signInLoading ? 'Signing in...' : 'Login or Sign Up'}
          </button>
          {error && (
            <span className="text-xs text-red-600 max-w-xs text-right">
              {error}
            </span>
          )}
        </div>
      )}
    </div>
  );
} 