"use client";

import { useState, useEffect } from 'react';
import { supabase, getCollections, getSignedUrl } from '@/lib/supabase';
import { Trash2, ShoppingCart, CreditCard, Clock, Image as ImageIcon, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';

interface CartItem {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  thumbnail_path: string;
  photo_paths: string[];
}

interface Collection {
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
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [thumbnailUrls, setThumbnailUrls] = useState<{[key: string]: string}>({});
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState<{[key: string]: boolean}>({});

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

    // Load all collections for suggestions
    loadAllCollections();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const loadCart = () => {
    if (typeof window !== 'undefined') {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(cart);
    }
  };

  const loadAllCollections = async () => {
    try {
      const { data, error } = await getCollections();
      if (!error && data) {
        setAllCollections(data);
        loadThumbnails(data);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const loadThumbnails = async (collections: Collection[]) => {
    const thumbnailPromises = collections.map(async (collection) => {
      if (collection.thumbnail_path) {
        try {
          const { data, error } = await getSignedUrl('media', collection.thumbnail_path, 3600);
          if (!error && data) {
            return { id: collection.id, url: data.signedUrl };
          }
        } catch (error) {
          console.error('Failed to load thumbnail for', collection.id, error);
        }
      }
      return { id: collection.id, url: null };
    });

    const results = await Promise.all(thumbnailPromises);
    const urlMap: {[key: string]: string} = {};
    results.forEach(result => {
      if (result.url) {
        urlMap[result.id] = result.url;
      }
    });
    setThumbnailUrls(urlMap);
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

  const addToCart = (collection: Collection) => {
    setAddingItems(prev => new Set(prev).add(collection.id));
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const isAlreadyInCart = cart.some((item: any) => item.id === collection.id);
    
    if (!isAlreadyInCart) {
      // Check purchase limit (max 1 collection at a time)
      if (cart.length >= 1) {
        alert('Purchase limit reached! You can only have 1 collection active at a time. Please complete your current purchase before adding more.');
        setAddingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(collection.id);
          return newSet;
        });
        return;
      }
      
      cart.push(collection);
      localStorage.setItem('cart', JSON.stringify(cart));
      setCartItems(cart);
      window.dispatchEvent(new Event('cartUpdated'));
    }

    // Remove loading state after animation
    setTimeout(() => {
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(collection.id);
        return newSet;
      });
    }, 800);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price / 100), 0);
  };

  const getTotalDuration = () => {
    return cartItems.reduce((total, item) => total + item.duration, 0);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const toggleDescription = (itemId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleCheckout = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (cartItems.length === 0) return;

    setCheckoutLoading(true);

    // Log mobile detection for debugging
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('Mobile device detected:', isMobileDevice);
    console.log('User agent:', navigator.userAgent);

    try {
      // Get the user's session token with better mobile handling
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        alert('Authentication error. Please try logging in again.');
        window.location.href = '/login';
        return;
      }
      
      if (!session) {
        console.log('No session found, redirecting to login');
        window.location.href = '/login';
        return;
      }

      console.log('Session found:', !!session);
      console.log('Session user ID:', session.user?.id);
      console.log('Session access token length:', session.access_token?.length);
      
      // Validate the session is still valid
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User validation error:', userError);
        alert('Authentication validation failed. Please try logging in again.');
        window.location.href = '/login';
        return;
      }
      
      if (!currentUser) {
        console.log('No current user found, redirecting to login');
        window.location.href = '/login';
        return;
      }

      console.log('Current user validated:', currentUser.id);
      console.log('Current user email:', currentUser.email);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
          items: cartItems,
          userId: currentUser.id,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Checkout error:', data.error);
        alert('Checkout failed: ' + data.error);
        return;
      }

      if (data.sessionId) {
        // Use direct URL redirect for better mobile compatibility
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        if (stripe) {
          try {
            const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
            if (error) {
              console.error('Stripe checkout error:', error);
              // Fallback to direct URL redirect
              window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
            }
          } catch (redirectError) {
            console.error('Redirect error:', redirectError);
            // Fallback to direct URL redirect
            window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
          }
        } else {
          // Fallback if Stripe fails to load
          window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Get suggested collections (not in cart)
  const getSuggestedCollections = () => {
    const cartItemIds = cartItems.map(item => item.id);
    return allCollections
      .filter(collection => !cartItemIds.includes(collection.id))
      .slice(0, 6); // Show up to 6 suggestions
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-almond pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Loading cart...</p>
        </div>
      </div>
    );
  }

  const suggestedCollections = getSuggestedCollections();

  return (
    <div className="min-h-screen bg-almond pt-20">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href="/collections"
              className="flex items-center text-sage hover:text-khaki transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Continue Shopping
            </Link>
          </div>
          
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sage hover:text-khaki transition-colors font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="mb-8">
          <h1 className="heading-1 mb-2">Your Cart</h1>
          <p className="text-sage">
            {cartItems.length} {cartItems.length === 1 ? 'collection' : 'collections'} selected
          </p>
          
          {/* Purchase Limit Notice */}
          <div className="mt-4 p-4 bg-khaki/10 border border-khaki/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="text-khaki mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm text-sage">
                <p className="font-medium text-earth mb-1">Purchase Limit Notice</p>
                <p>You can only have <strong>1 collection active at a time</strong>. This helps ensure you can fully enjoy each collection before purchasing the next one. Complete your current purchase to add more collections.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Content */}
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="card-glass max-w-md mx-auto p-12">
              <div className="text-sage mb-6">
                <ShoppingCart className="w-24 h-24 mx-auto" />
              </div>
              <h2 className="heading-2 mb-4">Your cart is empty</h2>
              <p className="text-sage mb-8">Browse our exclusive collections to add items to your cart.</p>
              <Link
                href="/collections"
                className="btn-primary"
              >
                Browse Collections
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => {
                const thumbnailUrl = thumbnailUrls[item.id];
                
                return (
                  <div
                    key={item.id}
                    className="card p-6"
                  >
                    <div className="flex items-start space-x-6">
                      {/* Thumbnail */}
                      <div className="w-24 h-32 bg-gradient-to-br from-mushroom to-blanket rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-sage/60" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-serif text-earth mb-2">
                          {item.title}
                        </h3>
                        <div className="text-sage text-sm mb-3">
                          <p className={`${expandedDescriptions[item.id] ? '' : 'line-clamp-2'}`}>
                            {item.description}
                          </p>
                          {item.description.length > 100 && (
                            <button
                              onClick={() => toggleDescription(item.id)}
                              className="text-khaki hover:text-earth text-xs mt-1 underline"
                            >
                              {expandedDescriptions[item.id] ? 'Show Less' : 'Read More'}
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-sage">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDuration(item.duration)}
                          </div>
                          <div className="flex items-center">
                            <ImageIcon className="w-3 h-3 mr-1" />
                            {item.photo_paths?.length || 0} photos
                          </div>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="flex flex-col items-end space-y-3">
                        <div className="text-2xl font-bold text-earth">
                          ${(item.price / 100).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-sage hover:text-khaki transition-colors p-2 hover:bg-blanket/50 rounded-lg"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checkout Summary */}
            <div className="lg:col-span-1">
              <div className="card-glass p-6 sticky top-24">
                <h2 className="text-xl font-serif text-earth mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sage">
                    <span>Items ({cartItems.length})</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sage">
                    <span>Total Access Time</span>
                    <span>{formatDuration(getTotalDuration())}</span>
                  </div>
                  
                  <div className="border-t border-mushroom/30 pt-4">
                    <div className="flex justify-between text-xl font-bold text-earth">
                      <span>Total</span>
                      <span>${getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                {user ? (
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? (
                      <>
                        <div className="w-4 h-4 spinner"></div>
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
                    <div className="text-center text-sage text-sm">
                      Sign in to complete your purchase
                    </div>
                    <Link
                      href="/login"
                      className="w-full btn-secondary text-center block"
                    >
                      Sign Up or Login with Google
                    </Link>
                  </div>
                )}

                {/* Cart Limit Indicator */}
                {cartItems.length >= 1 && (
                  <div className="mt-4 p-3 bg-khaki/10 border border-khaki/20 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-khaki">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>Cart limit reached (1/1)</span>
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                <div className="mt-6 text-xs text-sage text-center space-y-1">
                  <p>Secure checkout powered by Stripe</p>
                  <p>Supports Apple Pay, Google Pay & all major cards</p>
                  <p className="text-khaki">SSL encrypted • 256-bit security</p>
                </div>

                {/* Features */}
                <div className="mt-6 space-y-2 text-xs text-sage">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-sage rounded-full mr-2"></div>
                    <span>Instant access after payment</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-sage rounded-full mr-2"></div>
                    <span>Time-limited exclusive content</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-sage rounded-full mr-2"></div>
                    <span>HD quality videos & photos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* You Might Also Like Section */}
        {suggestedCollections.length > 0 && (
          <div className="mt-16">
            <h2 className="heading-2 mb-8 text-center">You Might Also Like</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedCollections.map((collection) => {
                const thumbnailUrl = thumbnailUrls[collection.id];
                const isAdding = addingItems.has(collection.id);
                
                return (
                  <div
                    key={collection.id}
                    className="card group hover:shadow-elegant transition-all duration-300"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[4/5] overflow-hidden rounded-t-xl">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={collection.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-mushroom to-blanket flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-sage/60" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-serif text-earth text-lg mb-2 line-clamp-2">
                        {collection.title}
                      </h3>
                      
                      <div className="text-sage text-sm mb-3">
                        <p className={`${expandedDescriptions[collection.id] ? '' : 'line-clamp-2'}`}>
                          {collection.description}
                        </p>
                        {collection.description.length > 100 && (
                          <button
                            onClick={() => toggleDescription(collection.id)}
                            className="text-khaki hover:text-earth text-xs mt-1 underline"
                          >
                            {expandedDescriptions[collection.id] ? 'Show Less' : 'Read More'}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xs text-sage">
                          {collection.photo_paths?.length || 0} photos • {formatDuration(collection.duration)}
                        </div>
                        <div className="text-lg font-bold text-earth">
                          ${(collection.price / 100).toFixed(2)}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => addToCart(collection)}
                        disabled={isAdding}
                        className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {isAdding ? (
                          <>
                            <div className="w-4 h-4 spinner"></div>
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 