"use client";

import { useState, useEffect } from 'react';
import { supabase, getCollections, getSignedUrl } from '@/lib/supabase';
import { Trash2, ShoppingCart, CreditCard, Clock, Image as ImageIcon, ArrowLeft, Plus, Heart } from 'lucide-react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';

interface CartItem {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // access duration
  video_duration: number; // actual video length
  thumbnail_path: string;
  photo_paths: string[];
}

interface Collection {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // access duration
  video_duration: number; // actual video length
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
  const [selectedTip, setSelectedTip] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');

  useEffect(() => {
    // Get user session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    getSession();
  }, []);

  useEffect(() => {
    loadCart();
    loadAllCollections();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const handleCartUpdate = () => {
    loadCart();
  };

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
  };

  const loadAllCollections = async () => {
    try {
      const { data, error } = await getCollections();
      if (!error && data) {
        setAllCollections(data);
        await loadThumbnails(data);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const loadThumbnails = async (collections: Collection[]) => {
    const results = await Promise.all(
      collections.map(async (collection) => {
        if (collection.thumbnail_path) {
          try {
            const { data, error } = await getSignedUrl('media', collection.thumbnail_path, 3600);
            if (!error && data) {
              return { id: collection.id, url: data.signedUrl };
            }
          } catch (error) {
            console.error('Error loading thumbnail for', collection.id, error);
          }
        }
        return { id: collection.id, url: null };
      })
    );

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
      cart.push(collection);
      localStorage.setItem('cart', JSON.stringify(cart));
      setCartItems(cart);
      window.dispatchEvent(new Event('cartUpdated'));
    }
    
    setTimeout(() => {
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(collection.id);
        return newSet;
      });
    }, 1000);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price / 100), 0);
  };

  const getTotalVideoDuration = () => {
    return cartItems.reduce((total, item) => total + (item.video_duration || 300), 0);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatVideoDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const toggleDescription = (itemId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleTipChange = (tipAmount: number) => {
    setSelectedTip(tipAmount);
    setCustomTip('');
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    setSelectedTip(0);
  };

  const getTipAmount = () => {
    if (selectedTip > 0) {
      return selectedTip;
    }
    if (customTip) {
      const amount = parseFloat(customTip);
      return isNaN(amount) ? 0 : amount;
    }
    return 0;
  };

  const getFinalTotal = () => {
    return getTotalPrice() + getTipAmount();
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
          tipAmount: getTipAmount(),
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
      <div className="min-h-screen bg-brand-mist flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-brand-earth">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-brand-mist">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-brand-sage mx-auto mb-4" />
            <h1 className="text-3xl font-serif text-brand-pine mb-4">Your Cart is Empty</h1>
            <p className="text-brand-earth mb-8">Add some amazing content to get started!</p>
            <Link
              href="/collections"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Browse Collections</span>
            </Link>
          </div>

          {/* Suggested Collections */}
          <div className="mt-16">
            <h2 className="text-2xl font-serif text-brand-pine mb-8 text-center">Discover Amazing Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getSuggestedCollections().map((collection) => (
                <div key={collection.id} className="card-glass p-6">
                  <div className="aspect-video bg-brand-almond rounded-lg mb-4 overflow-hidden">
                    {thumbnailUrls[collection.id] ? (
                      <img
                        src={thumbnailUrls[collection.id]}
                        alt={collection.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-sage">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-serif text-brand-pine mb-2">{collection.title}</h3>
                  <p className="text-brand-earth text-sm mb-3 line-clamp-2">{collection.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-xs text-brand-sage">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatVideoDuration(collection.video_duration || 300)}</span>
                      </div>
                      <div className="flex items-center">
                        <ImageIcon className="w-3 h-3 mr-1" />
                        <span>{collection.photo_paths?.length || 0} photos</span>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-brand-tan">
                      ${(collection.price / 100).toFixed(2)}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => addToCart(collection)}
                    disabled={addingItems.has(collection.id)}
                    className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {addingItems.has(collection.id) ? (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-mist">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif text-brand-pine mb-2">Your Cart</h1>
            <p className="text-brand-earth">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart</p>
          </div>
          <button
            onClick={clearCart}
            className="text-brand-sage hover:text-brand-khaki transition-colors"
          >
            Clear Cart
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {cartItems.map((item, index) => {
                const thumbnailUrl = thumbnailUrls[item.id];
                
                return (
                  <div key={item.id + index} className="card-glass p-6">
                    <div className="flex gap-6">
                      {/* Thumbnail */}
                      <div className="w-32 h-24 bg-brand-almond rounded-lg overflow-hidden flex-shrink-0">
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-sage">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-serif text-brand-pine mb-2">{item.title}</h3>
                            <p className="text-brand-earth text-sm mb-3">
                              {expandedDescriptions[item.id] 
                                ? item.description 
                                : item.description.length > 100 
                                  ? `${item.description.substring(0, 100)}...` 
                                  : item.description
                              }
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
                        
                        <div className="flex items-center space-x-4 text-xs text-sage">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>Video: {formatVideoDuration(item.video_duration || 300)}</span>
                          </div>
                          <div className="flex items-center">
                            <ImageIcon className="w-3 h-3 mr-1" />
                            {item.photo_paths?.length || 0} photos
                          </div>
                        </div>
                        
                        {/* Legal Notice */}
                        <div className="mt-2 p-2 bg-khaki/10 border border-khaki/20 rounded text-xs text-khaki">
                          <div className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                            </svg>
                            <span>DMCA protection required before viewing</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                  <span>Total Video Content</span>
                  <span>{formatVideoDuration(getTotalVideoDuration())}</span>
                </div>
                
                <div className="flex justify-between text-sage">
                  <span>Access Window</span>
                  <span>Permanent Access</span>
                </div>
              </div>

              {/* Tip Section */}
              <div className="mb-6 p-4 bg-brand-almond/30 rounded-lg">
                <div className="flex items-center mb-3">
                  <Heart className="w-4 h-4 text-brand-khaki mr-2" />
                  <h3 className="text-sm font-semibold text-brand-pine">Add a Tip</h3>
                </div>
                <p className="text-xs text-brand-earth mb-3">
                  Support the creators and help us continue making amazing content!
                </p>
                
                {/* Tip Options */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[2, 5, 10].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleTipChange(amount)}
                      className={`px-3 py-2 text-xs rounded border transition-colors ${
                        selectedTip === amount
                          ? 'bg-brand-khaki text-white border-brand-khaki'
                          : 'bg-white text-brand-pine border-brand-sage hover:bg-brand-almond'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                
                {/* Custom Tip */}
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Custom amount"
                    value={customTip}
                    onChange={(e) => handleCustomTipChange(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-brand-sage rounded focus:outline-none focus:border-brand-khaki"
                    min="0"
                    step="0.01"
                  />
                  <span className="text-xs text-brand-sage">USD</span>
                </div>
              </div>

              {/* Tip Display */}
              {getTipAmount() > 0 && (
                <div className="mb-4 p-3 bg-brand-khaki/10 border border-brand-khaki/20 rounded">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-brand-pine">Tip Amount</span>
                    <span className="font-semibold text-brand-khaki">${getTipAmount().toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              <div className="border-t border-mushroom/30 pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold text-earth">
                  <span>Total</span>
                  <span>${getFinalTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-600 mt-0.5">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Legal Notice</p>
                    <p>Before viewing content, you'll be required to accept our DMCA copyright protection terms and conditions. This is a mandatory step to ensure content protection compliance.</p>
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
                  <span>DMCA protection required</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-sage rounded-full mr-2"></div>
                  <span>HD quality videos & photos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 