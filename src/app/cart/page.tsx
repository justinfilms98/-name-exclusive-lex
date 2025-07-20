"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, ShoppingCart, CreditCard, Clock, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface CartItem {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  thumbnail_path: string;
  photo_paths: string[];
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    // Get user session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Load cart from localStorage
    loadCart();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
  };

  const removeFromCart = (itemId: string) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.setItem('cart', JSON.stringify([]));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  const getTotalDuration = () => {
    return cartItems.reduce((total, item) => total + item.duration, 0);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const handleCheckout = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (cartItems.length === 0) return;

    setCheckoutLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          items: cartItems,
          userId: user.id,
        }),
    });

      const { url, error } = await response.json();
      
      if (error) {
        console.error('Checkout error:', error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand pt-20 flex items-center justify-center">
        <div className="text-center text-pearl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-salmon mx-auto mb-4"></div>
          <p className="text-green">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand pt-20">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-serif text-pearl mb-2">Your Cart</h1>
            <p className="text-green">
              {cartItems.length} {cartItems.length === 1 ? 'collection' : 'collections'} selected
            </p>
          </div>
          
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-salmon hover:text-cyan transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Cart Content */}
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-salmon mb-6">
              <ShoppingCart className="w-24 h-24 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-pearl mb-4">Your cart is empty</h2>
            <p className="text-green mb-8">Browse our exclusive collections to add items to your cart.</p>
            <Link
              href="/collections"
              className="btn-primary px-8 py-3 rounded-full font-medium text-lg"
            >
              Browse Collections
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-pearl bg-opacity-10 backdrop-blur-sm rounded-lg border border-pearl border-opacity-20 p-6"
                >
                  <div className="flex items-start space-x-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 bg-gradient-to-br from-salmon to-cyan rounded-lg flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-8 h-8 text-pearl" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-pearl mb-1">
                        {item.title}
                      </h3>
                      <p className="text-green text-sm mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-cyan">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(item.duration)}
                        </div>
                        <div>
                          {item.photo_paths?.length || 0} photos
                        </div>
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-xl font-bold text-salmon">
                        ${item.price}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-salmon hover:text-cyan transition-colors p-1"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

            {/* Checkout Summary */}
            <div className="lg:col-span-1">
              <div className="bg-pearl bg-opacity-10 backdrop-blur-sm rounded-lg border border-pearl border-opacity-20 p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-pearl mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-green">
                    <span>Items ({cartItems.length})</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
              </div>
                  
                  <div className="flex justify-between text-green">
                    <span>Total Access Time</span>
                    <span>{formatDuration(getTotalDuration())}</span>
              </div>
                  
                  <div className="border-t border-pearl border-opacity-20 pt-3">
                    <div className="flex justify-between text-xl font-bold text-pearl">
                <span>Total</span>
                      <span className="text-salmon">${getTotalPrice().toFixed(2)}</span>
                    </div>
              </div>
            </div>

                {/* Checkout Button */}
                {user ? (
            <button
              onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full bg-salmon hover:bg-cyan text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                    {checkoutLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Checkout with Stripe</span>
                      </>
                    )}
            </button>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center text-salmon text-sm">
                      Sign in to complete your purchase
          </div>
                    <Link
                      href="/login"
                      className="w-full btn-secondary py-3 px-4 rounded-lg font-medium text-center block"
                    >
                      Sign In with Google
                    </Link>
        </div>
                )}

                {/* Payment Info */}
                <div className="mt-4 text-xs text-green text-center">
                  <p>Secure checkout powered by Stripe</p>
                  <p>Supports Apple Pay, Google Pay & all major cards</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
    </div>
  );
} 