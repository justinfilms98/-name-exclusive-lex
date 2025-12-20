"use client";

import { useState, useEffect } from 'react';
import { getCollections, supabase, getSignedUrl } from '@/lib/supabase';
import { Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CollectionCard from '@/components/CollectionCard';
import type { User } from '@supabase/supabase-js';

interface Collection {
  id: string;
  title: string;
  description: string;
  price: number;
  video_duration: number; // actual video length
  thumbnail_path: string;
  photo_paths: string[];
  album_id?: string | null;
  albums?: { id: string; name: string; slug: string } | null;
  created_at: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPurchases, setUserPurchases] = useState<string[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<{[key: string]: string}>({});
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // Get collections
      const { data, error } = await getCollections();
      if (!error && data) {
        setCollections(data);
        // Load thumbnails for all collections
        loadThumbnails(data);
      }

      // Get user purchases if logged in
      if (session?.user) {
        const { data: purchases } = await supabase
          .from('purchases')
          .select('collection_id')
          .eq('user_id', session.user.id);
        
        if (purchases) {
          setUserPurchases(purchases.map(p => p.collection_id));
        }
      }

      setLoading(false);
    };

    loadData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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

  const addToCart = async (collection: Collection) => {
    console.log('🔍 DEBUG: addToCart called for collection:', collection.title);
    
    if (userPurchases.includes(collection.id)) {
      console.log('🔍 DEBUG: Collection already purchased, redirecting to watch');
      router.push(`/collections/${collection.id}/watch`);
      return;
    }

    if (!user) {
      console.log('🔍 DEBUG: No user, redirecting to login');
      router.push('/login');
      return;
    }

    console.log('🔍 DEBUG: Setting adding to cart state');
    setAddingToCart(collection.id);

    // Add to cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]') as Collection[];
    const isAlreadyInCart = cart.some((item: Collection) => item.id === collection.id);
    
    console.log('🔍 DEBUG: Cart check - isAlreadyInCart:', isAlreadyInCart);
    
    if (!isAlreadyInCart) {
      console.log('🔍 DEBUG: Adding collection to cart');
      cart.push(collection);
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Show success toast
      console.log('🔍 DEBUG: Showing success toast');
      showToast(`"${collection.title}" added to your cart!`, 'success');
    } else {
      // Show already in cart toast
      console.log('🔍 DEBUG: Showing already in cart toast');
      showToast(`"${collection.title}" is already in your cart!`, 'error');
    }

    // Small delay for visual feedback
    setTimeout(() => {
      console.log('🔍 DEBUG: Clearing adding to cart state');
      setAddingToCart(null);
    }, 800);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    console.log('🔍 DEBUG: showToast called with message:', message, 'type:', type);
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };
    
    console.log('🔍 DEBUG: Adding toast to state:', newToast);
    setToasts(prev => {
      console.log('🔍 DEBUG: Current toasts:', prev);
      const newToasts = [...prev, newToast];
      console.log('🔍 DEBUG: New toasts array:', newToasts);
      return newToasts;
    });
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      console.log('🔍 DEBUG: Auto-removing toast:', id);
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id: string) => {
    console.log('🔍 DEBUG: removeToast called for id:', id);
    setToasts(prev => {
      const filtered = prev.filter(toast => toast.id !== id);
      console.log('🔍 DEBUG: Toasts after removal:', filtered);
      return filtered;
    });
  };

  // Debug effect to log toast changes
  useEffect(() => {
    console.log('🔍 DEBUG: Toasts state changed, count:', toasts.length);
    toasts.forEach(toast => {
      console.log('🔍 DEBUG: Toast in state:', toast);
    });
  }, [toasts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-almond flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Loading collections...</p>
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="min-h-screen bg-almond">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center py-16">
            <div className="text-sage mb-4">
              <ImageIcon className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="heading-2 mb-4">No Collections Available</h2>
            <p className="body-large text-sage mb-8">New exclusive content coming soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-almond">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => {
          return (
            <div
              key={toast.id}
              className={`max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
                toast.type === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {toast.type === 'success' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">{toast.message}</span>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="ml-4 text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <h1 className="heading-1 mb-2 sm:mb-3 md:mb-4">Exclusive Collections</h1>
          <p className="text-earth opacity-75 max-w-2xl mx-auto text-base sm:text-lg">
            Premium exclusive content with permanent access. Each collection offers behind-the-scenes experiences.
          </p>
          <div className="mt-3 sm:mt-4">
            <Link href="/albums" className="btn-secondary inline-flex">
              Browse by album
            </Link>
          </div>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-2 max-[430px]:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {collections.map((collection) => {
            const isPurchased = userPurchases.includes(collection.id);
            const thumbnailUrl = thumbnailUrls[collection.id];
            const isAdding = addingToCart === collection.id;

            return (
              <CollectionCard
                key={collection.id}
                collection={collection}
                isPurchased={isPurchased}
                thumbnailUrl={thumbnailUrl}
                isAdding={isAdding}
                onAddToCart={() => addToCart(collection)}
              />
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="card-glass max-w-2xl mx-auto p-8">
            <h2 className="heading-3 mb-4">Ready for Exclusive Access?</h2>
            <p className="text-sage mb-6">
              Each collection offers premium behind-the-scenes content with permanent access.
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login" className="btn-primary">
                  Sign Up or Login with Google
                </Link>
                <Link href="/cart" className="btn-secondary">
                  View Cart
                </Link>
              </div>
            )}
            {user && (
              <Link href="/cart" className="btn-primary">
                Go to Cart
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 