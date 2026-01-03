"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { supabase, signInWithGoogle, signOut } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { User, LogOut, ShoppingCart, Menu, X, DollarSign, Instagram, Youtube } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function Header() {
  // Social media URLs - access env vars in component to ensure they're available
  const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/lexigriswold";
  const YOUTUBE_URL = process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://www.youtube.com/@alexisgriswold";
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Construction banner removed; keep header at top with no offset

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

  // Set mounted state for portal rendering
  useEffect(() => {
    setMounted(true);
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
    try {
      // Clear any existing auth data to force fresh login
      if (typeof window !== 'undefined') {
        // Clear any cached auth data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('google')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Sign in error:', error);
      }
    } catch (err) {
      console.error('Sign in exception:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Starting logout process...');
      
      // First, clear all storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        console.log('Storage cleared');
      }
      
      // Then sign out from Supabase
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      
      console.log('Supabase sign out completed');
      
      // Clear cart specifically
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify([]));
        window.dispatchEvent(new Event('cartUpdated'));
      }
      
      // Show a brief message about account switching
      console.log('Logout completed. You can now switch accounts on next login.');
      
      // Force a complete page reload to ensure clean state
      console.log('Redirecting to home page...');
      window.location.replace('/');
      
    } catch (err) {
      console.error('Sign out exception:', err);
      // Force logout even if there's an error
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('/');
      }
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Render drawer menu at root level using portal
  const drawerMenu = mobileMenuOpen && mounted && typeof window !== 'undefined' ? createPortal(
    <>
      {/* Backdrop - full screen overlay */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
        onClick={closeMobileMenu}
      />

      {/* Menu Content - fixed to far left edge of viewport, mounted at root */}
      <div 
        className="fixed left-0 top-0 h-screen w-[280px] md:w-[360px] bg-blanc border-r border-mushroom/30 shadow-lg overflow-y-auto z-[70]"
      >
        {/* Close button inside drawer at top */}
        <div className="sticky top-0 bg-blanc border-b border-mushroom/30 p-4 flex justify-end z-10">
          <button
            onClick={closeMobileMenu}
            className="p-2 text-earth hover:text-khaki transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="px-4 py-6 md:px-6 md:py-8 space-y-4">
          
          {/* Navigation Links */}
          <Link 
            href="/albums" 
            className="block text-earth hover:text-khaki transition-colors font-medium py-3 px-2 rounded-lg hover:bg-blanket/30"
            onClick={closeMobileMenu}
          >
            Albums
          </Link>

          {user && isAdmin(user.email) && (
            <Link 
              href="/admin" 
              className="block text-sage hover:text-khaki transition-colors font-medium py-3 px-2 rounded-lg hover:bg-blanket/30"
              onClick={closeMobileMenu}
            >
              Admin Panel
            </Link>
          )}

          {user && (
            <>
              <Link 
                href="/account" 
                className="block text-earth hover:text-khaki transition-colors font-medium py-3 px-2 rounded-lg hover:bg-blanket/30"
                onClick={closeMobileMenu}
              >
                My Account
              </Link>

              <Link 
                href="/donate" 
                className="block text-earth hover:text-brand-khaki transition-colors font-medium py-3 px-2 rounded-lg hover:bg-blanket/30"
                onClick={closeMobileMenu}
              >
                Support Alexis
              </Link>

              <Link 
                href="/cart" 
                className="block text-earth hover:text-sage transition-colors font-medium py-3 px-2 rounded-lg hover:bg-blanket/30"
                onClick={closeMobileMenu}
              >
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>

              <button
                onClick={() => {
                  handleSignOut();
                  closeMobileMenu();
                }}
                className="block w-full text-left text-earth hover:text-sage transition-colors font-medium py-3 px-2 rounded-lg hover:bg-blanket/30"
              >
                Sign Out
              </button>
            </>
          )}

          {/* Follow me section */}
          <div className="pt-4 mt-4 border-t border-mushroom/30">
            <p className="text-earth font-medium mb-3 px-2">Follow me</p>
            <div className="flex items-center space-x-4 px-2">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (INSTAGRAM_URL === "PUT_PLACEHOLDER" || INSTAGRAM_URL.includes("PUT_PLACEHOLDER")) {
                    e.preventDefault();
                    return;
                  }
                  closeMobileMenu();
                }}
                className="p-2 text-earth hover:text-brand-khaki transition-colors rounded-lg hover:bg-blanket/30"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (YOUTUBE_URL === "PUT_PLACEHOLDER" || YOUTUBE_URL.includes("PUT_PLACEHOLDER")) {
                    e.preventDefault();
                    return;
                  }
                  closeMobileMenu();
                }}
                className="p-2 text-earth hover:text-brand-khaki transition-colors rounded-lg hover:bg-blanket/30"
                aria-label="YouTube"
              >
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>

          {!user && (
            <button
              onClick={() => {
                handleSignIn();
                closeMobileMenu();
              }}
              className="block w-full btn-primary text-center py-3"
            >
              Login or Sign Up
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <header 
        className={`bg-blanc/90 backdrop-blur-md border-b border-mushroom/30 fixed top-0 left-0 right-0 shadow-soft safe-top transition-all duration-300 ${mobileMenuOpen ? 'z-40' : 'z-50'}`}
      >
        {/* Hamburger Menu Button - Fixed at far left edge */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="absolute left-0 top-0 p-2 sm:p-3 md:p-4 text-earth hover:text-khaki transition-colors z-10 h-14 sm:h-16 flex items-center"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            
            {/* Left Side - Desktop Navigation Links (with left padding to account for hamburger) */}
            <div className="hidden md:flex items-center space-x-8 pl-12 md:pl-16">
              <Link href="/albums" className="text-earth hover:text-khaki transition-colors font-medium">
                Albums
              </Link>
              {user && isAdmin(user.email) && (
                <Link href="/admin" className="text-sage hover:text-khaki transition-colors font-medium">
                  Admin
                </Link>
              )}
            </div>

            {/* Spacer for mobile to push center content */}
            <div className="md:hidden w-10"></div>

            {/* Center - Site Name */}
            <div className="absolute left-1/2 transform -translate-x-1/2 px-12 sm:px-16 md:px-20">
              <Link href="/" className="text-xl sm:text-2xl md:text-[28px] font-serif text-earth hover:text-khaki transition-colors whitespace-nowrap">
                Exclusive Lex
              </Link>
            </div>

            {/* Right Side - User Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              {loading ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 spinner"></div>
              ) : user ? (
                <>
                  {/* Donation Icon */}
                  <Link 
                    href="/donate" 
                    className="p-1.5 sm:p-2 text-earth hover:text-brand-khaki transition-colors"
                    title="Support Our Creators"
                  >
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Link>

                  {/* Cart Icon */}
                  <Link 
                    href="/cart" 
                    className="relative p-1.5 sm:p-2 text-earth hover:text-sage transition-colors group"
                    title="Cart"
                  >
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-sage text-blanc text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium min-w-[16px] sm:min-w-[20px]">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Link>

                  {/* My Account (Hidden on Mobile) */}
                  <Link 
                    href="/account" 
                    className="hidden sm:flex items-center space-x-2 px-3 py-2 text-earth hover:text-khaki transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">My Account</span>
                  </Link>

                  {/* Account Icon Only (Mobile) */}
                  <Link 
                    href="/account" 
                    className="sm:hidden p-1.5 sm:p-2 text-earth hover:text-khaki transition-colors"
                    title="My Account"
                  >
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Link>

                  {/* Logout (Hidden on Mobile) */}
                  <button
                    onClick={handleSignOut}
                    className="hidden sm:flex items-center space-x-2 px-3 py-2 text-earth hover:text-sage transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>

                  {/* Logout Icon Only (Mobile) */}
                  <button
                    onClick={handleSignOut}
                    className="sm:hidden p-1.5 sm:p-2 text-earth hover:text-sage transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="btn-secondary text-sm sm:text-base px-3 py-2 sm:px-4 md:px-5 whitespace-nowrap"
                  title="Sign in with Google (you can switch accounts)"
                >
                  <span className="hidden sm:inline">Login or Sign Up</span>
                  <span className="sm:hidden">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      {drawerMenu}
    </>
  );
} 