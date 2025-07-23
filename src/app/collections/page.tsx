"use client";

import { useState, useEffect } from 'react';
import { getCollections, supabase, getSignedUrl } from '@/lib/supabase';
import { ShoppingCart, Clock, Image as ImageIcon, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Collection {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  thumbnail_path: string;
  photo_paths: string[];
  created_at: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPurchases, setUserPurchases] = useState<string[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<{[key: string]: string}>({});
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
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
          .eq('user_id', session.user.id)
          .gt('expires_at', new Date().toISOString());
        
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

  const addToCartAndRedirect = async (collection: Collection) => {
    if (userPurchases.includes(collection.id)) {
      router.push(`/watch/${collection.id}`);
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    setAddingToCart(collection.id);

    // Add to cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const isAlreadyInCart = cart.some((item: any) => item.id === collection.id);
    
    if (!isAlreadyInCart) {
      cart.push(collection);
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
    }

    // Small delay for visual feedback
    setTimeout(() => {
      setAddingToCart(null);
      router.push('/cart');
    }, 800);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const formatPrice = (price: number): string => {
    // Price is stored as cents, convert to dollars
    const dollars = price / 100;
    return dollars.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-almond pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Loading collections...</p>
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="min-h-screen bg-almond pt-20">
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
    <div className="min-h-screen bg-almond pt-20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="heading-1 mb-4">Exclusive Collections</h1>
          <p className="body-large text-sage max-w-2xl mx-auto">
            Premium exclusive content with limited-time access. Each collection offers behind-the-scenes experiences.
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="masonry-grid">
          {collections.map((collection, index) => {
            const isPurchased = userPurchases.includes(collection.id);
            const photoCount = collection.photo_paths?.length || 0;
            const thumbnailUrl = thumbnailUrls[collection.id];
            const isAdding = addingToCart === collection.id;
            
            return (
              <div
                key={collection.id}
                className="masonry-item group"
              >
                {/* Main Card Container */}
                <div className="relative overflow-hidden rounded-xl bg-blanc border border-mushroom/30 hover:shadow-elegant transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]">
                  
                  {/* Thumbnail Section */}
                  <div className="relative aspect-[4/6] overflow-hidden">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={collection.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback placeholder */}
                    <div className={`w-full h-full bg-gradient-to-br from-mushroom to-blanket flex items-center justify-center ${thumbnailUrl ? 'hidden' : ''}`}>
                      <ImageIcon className="w-16 h-16 text-sage/60" />
                    </div>

                    {/* Hover Overlay with Blur Background */}
                    <div className="absolute inset-0 bg-gradient-to-t from-earth via-earth/80 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm">
                      {/* Content that appears on hover */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 text-blanc transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        
                        {/* Title */}
                        <h3 className="text-xl font-serif mb-2 line-clamp-2">
                          {collection.title}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-blanket/90 text-sm mb-3 line-clamp-3 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
                          {collection.description}
                        </p>

                        {/* Metadata Row */}
                        <div className="flex items-center justify-between text-xs text-blanket/80 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDuration(collection.duration)}
                            </div>
                            <div className="flex items-center">
                              <ImageIcon className="w-3 h-3 mr-1" />
                              {photoCount} photos
                            </div>
                          </div>
                          <div className="text-lg font-bold text-blanket">
                            ${formatPrice(collection.price)}
                          </div>
                        </div>

                        {/* CTA Button */}
                        <button
                          onClick={() => addToCartAndRedirect(collection)}
                          disabled={isAdding}
                          className="w-full bg-sage text-blanc px-4 py-3 rounded-lg font-medium hover:bg-khaki transition-all duration-300 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-300 disabled:opacity-50"
                        >
                          {isAdding ? (
                            <>
                              <div className="w-4 h-4 spinner"></div>
                              <span>Adding...</span>
                            </>
                          ) : isPurchased ? (
                            <>
                              <span>Watch Now</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              <span>Unlock to Purchase</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Purchase Badge */}
                    {isPurchased && (
                      <div className="absolute top-3 right-3 bg-sage text-blanc px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        Owned
                      </div>
                    )}

                    {/* Loading State for Adding to Cart */}
                    {isAdding && (
                      <div className="absolute inset-0 bg-sage/20 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-sage text-blanc px-4 py-2 rounded-lg flex items-center space-x-2">
                          <div className="w-4 h-4 spinner"></div>
                          <span>Adding to cart...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Info Bar (Always Visible) */}
                  <div className="p-4 bg-blanc">
                    <h3 className="font-serif text-earth text-lg mb-1 line-clamp-1">
                      {collection.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sage text-sm">{photoCount} photos • {formatDuration(collection.duration)}</span>
                      <span className="text-earth font-bold">${formatPrice(collection.price)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="card-glass max-w-2xl mx-auto p-8">
            <h2 className="heading-3 mb-4">Ready for Exclusive Access?</h2>
            <p className="text-sage mb-6">
              Each collection offers premium behind-the-scenes content with time-limited access.
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login" className="btn-primary">
                  Sign In with Google
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