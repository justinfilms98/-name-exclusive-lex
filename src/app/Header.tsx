"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, signInWithGoogle, signOut } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { User, LogOut, ShoppingCart } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

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

  // Load cart count from localStorage
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.length);

    // Listen for cart updates
    const handleCartUpdate = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
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
    <header className="bg-header-tan text-pearl border-b border-pearl border-opacity-20 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Side - Navigation */}
          <div className="flex items-center space-x-6">
            <Link href="/collections" className="text-sm hover:text-salmon transition-colors">
              Collections
            </Link>
            {user && isAdmin(user.email) && (
              <Link href="/admin" className="text-sm hover:text-cyan transition-colors">
                Admin
              </Link>
            )}
          </div>

          {/* Center - Site Name */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="text-2xl font-serif text-pearl hover:text-salmon transition-colors">
              Exclusive Lex
            </Link>
          </div>

          {/* Right Side - User Actions */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-pearl border-t-transparent"></div>
            ) : user ? (
              <>
                {/* Cart Icon */}
                <Link href="/cart" className="relative p-2 hover:text-salmon transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-salmon text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Profile Icon */}
                <Link href="/account" className="p-2 hover:text-cyan transition-colors">
                  <User className="w-5 h-5" />
                </Link>

                {/* Logout Icon */}
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:text-salmon transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="text-xs bg-transparent border border-pearl border-opacity-50 text-pearl px-3 py-1.5 rounded hover:bg-pearl hover:text-sand transition-colors"
              >
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 