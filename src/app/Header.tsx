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

  return (
    <>
      <header className="bg-blanc/90 backdrop-blur-md border-b border-mushroom/30 fixed top-0 left-0 right-0 z-50 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left Side - Navigation (Desktop) */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/collections" className="text-earth hover:text-khaki transition-colors font-medium">
                Collections
              </Link>
              {user && isAdmin(user.email) && (
                <Link href="/admin" className="text-sage hover:text-khaki transition-colors font-medium">
                  Admin
                </Link>
              )}
            </div>

            {/* Mobile Menu Button (Left Side on Mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-earth hover:text-khaki transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Center - Site Name */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Link href="/" className="text-xl sm:text-2xl font-serif text-earth hover:text-khaki transition-colors">
                Exclusive Lex
              </Link>
            </div>

            {/* Right Side - User Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {loading ? (
                <div className="w-6 h-6 spinner"></div>
              ) : user ? (
                <>
                  {/* Cart Icon */}
                  <Link 
                    href="/cart" 
                    className="relative p-2 text-earth hover:text-sage transition-colors group"
                    title="Cart"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-sage text-blanc text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[20px]">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Link>

                  {/* My Account (Hidden on Mobile) */}
                  <Link 
                    href="/account" 
                    className="hidden sm:flex items-center space-x-2 px-3 py-2 text-earth hover:text-khaki transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">My Account</span>
                  </Link>

                  {/* Account Icon Only (Mobile) */}
                  <Link 
                    href="/account" 
                    className="sm:hidden p-2 text-earth hover:text-khaki transition-colors"
                    title="My Account"
                  >
                    <User className="w-5 h-5" />
                  </Link>

                  {/* Logout (Hidden on Mobile) */}
                  <button
                    onClick={handleSignOut}
                    className="hidden sm:flex items-center space-x-2 px-3 py-2 text-earth hover:text-sage transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Logout</span>
                  </button>

                  {/* Logout Icon Only (Mobile) */}
                  <button
                    onClick={handleSignOut}
                    className="sm:hidden p-2 text-earth hover:text-sage transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="btn-secondary text-sm px-3 py-2 sm:px-4 whitespace-nowrap"
                  title="Sign in with Google (you can switch accounts)"
                >
                  <span className="hidden sm:inline">Login or Sign Up</span>
                  <span className="sm:hidden">Login or Sign Up</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                onClick={closeMobileMenu}
              ></div>

              {/* Menu Content */}
              <div className="relative bg-blanc border-t border-mushroom/30 shadow-lg">
                <div className="px-4 py-6 space-y-4">
                  
                  {/* Navigation Links */}
                  <Link 
                    href="/collections" 
                    className="block text-earth hover:text-khaki transition-colors font-medium py-3 px-2 rounded-lg hover:bg-blanket/30"
                    onClick={closeMobileMenu}
                  >
                    Collections
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
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Spacer */}
      <div className={`md:hidden transition-all duration-300 ${mobileMenuOpen ? 'h-64' : 'h-0'}`}></div>
    </>
  );
} 