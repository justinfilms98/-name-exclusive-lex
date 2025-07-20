"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, signInWithGoogle, signOut } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { User, LogOut, ShoppingCart, Menu, X } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    const updateCartCount = () => {
      if (typeof window !== 'undefined') {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(cart.length);
      }
    };

    updateCartCount();

    // Listen for cart updates
    const handleCartUpdate = () => updateCartCount();
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
    // Clear cart on logout
    localStorage.setItem('cart', JSON.stringify([]));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <header className="bg-blanc/90 backdrop-blur-md border-b border-mushroom/30 fixed top-0 left-0 right-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Side - Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/collections" className="text-earth hover:text-khaki transition-colors font-medium">
              Collections
            </Link>
            {user && isAdmin(user.email) && (
              <Link href="/admin" className="text-sage hover:text-khaki transition-colors font-medium">
                Admin
              </Link>
            )}
          </div>

          {/* Center - Site Name */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="text-2xl font-serif text-earth hover:text-khaki transition-colors">
              Exclusive Lex
            </Link>
          </div>

          {/* Right Side - User Actions */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-6 h-6 spinner"></div>
            ) : user ? (
              <>
                {/* Cart Icon */}
                <Link 
                  href="/cart" 
                  className="relative p-2 text-earth hover:text-sage transition-colors group"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-sage text-blanc text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* My Account */}
                <Link 
                  href="/account" 
                  className="flex items-center space-x-2 px-3 py-2 text-earth hover:text-khaki transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">My Account</span>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 text-earth hover:text-sage transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="btn-secondary text-sm px-4 py-2"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-earth hover:text-khaki transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-mushroom/30">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/collections" 
                className="text-earth hover:text-khaki transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Collections
              </Link>
              {user && isAdmin(user.email) && (
                <Link 
                  href="/admin" 
                  className="text-sage hover:text-khaki transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              {user && (
                <Link 
                  href="/account" 
                  className="text-earth hover:text-khaki transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Account
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 