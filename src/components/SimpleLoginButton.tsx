"use client";

import { useState, useEffect } from 'react';
import { signInWithGoogle, signOut, supabase } from '@/lib/supabase-auth';
import { User } from '@supabase/supabase-js';

export default function SimpleLoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-stone-800"></div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-stone-600">Welcome, {user.email}</span>
        <button
          onClick={handleSignOut}
          className="text-stone-600 hover:text-stone-800 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="bg-stone-800 text-white px-4 py-2 rounded-md hover:bg-stone-900 transition-colors"
    >
      Sign In with Google
    </button>
  );
} 