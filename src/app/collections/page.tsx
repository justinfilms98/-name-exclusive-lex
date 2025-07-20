"use client";

import { useState, useEffect } from 'react';
import { getCollections, supabase } from '@/lib/supabase';
import { ShoppingCart, Clock, Image as ImageIcon, Heart } from 'lucide-react';
import Link from 'next/link';

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

  useEffect(() => {
    const loadData = async () => {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // Get collections
      const { data, error } = await getCollections();
      if (!error && data) {
        setCollections(data);
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

  const addToCart = (collection: Collection) => {
    if (userPurchases.includes(collection.id)) {
      return; // Already purchased
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const isAlreadyInCart = cart.some((item: any) => item.id === collection.id);
    
    if (!isAlreadyInCart) {
      cart.push(collection);
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Trigger cart update event
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Add visual feedback
      const button = document.getElementById(`cart-btn-${collection.id}`);
      if (button) {
        button.classList.add('cart-bounce');
        setTimeout(() => button.classList.remove('cart-bounce'), 600);
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const formatPrice = (price: number): string => {
    return price.toFixed(2);
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
            
            return (
              <div
                key={collection.id}
                className="masonry-item collection-card"
              >
                {/* Thumbnail */}
                <div className="relative h-full bg-gradient-to-br from-mushroom to-blanket group overflow-hidden">
                  {/* Placeholder for thumbnail */}
                  <div className="w-full h-2/3 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-sage/60 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  
                  {/* Content Section */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-earth via-earth/80 to-transparent">
                    <h3 className="text-blanc font-serif text-xl mb-2 line-clamp-2">
                      {collection.title}
                    </h3>
                    
                    <p className="text-blanket/90 text-sm mb-3 line-clamp-2">
                      {collection.description}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-blanket/80 mb-4">
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
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-blanket">
                        ${formatPrice(collection.price)}
                      </div>

                      {isPurchased ? (
                        <Link
                          href={`/watch/${collection.id}`}
                          className="bg-sage text-blanc px-4 py-2 rounded-lg text-sm font-medium hover:bg-khaki transition-colors"
                        >
                          Watch Now
                        </Link>
                      ) : user ? (
                        <button
                          id={`cart-btn-${collection.id}`}
                          onClick={() => addToCart(collection)}
                          className="bg-sage text-blanc px-4 py-2 rounded-lg text-sm font-medium hover:bg-khaki transition-all duration-300 flex items-center space-x-2 hover:shadow-soft"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </button>
                      ) : (
                        <Link
                          href="/login"
                          className="bg-blanket text-earth px-4 py-2 rounded-lg text-sm font-medium hover:bg-blanc transition-colors"
                        >
                          Sign In
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Hover Overlay Effect */}
                  <div className="masonry-overlay absolute inset-0 flex items-center justify-center">
                    <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      {!isPurchased && user && (
                        <button
                          onClick={() => addToCart(collection)}
                          className="bg-blanc text-earth px-6 py-3 rounded-lg font-medium shadow-elegant hover:shadow-glass transition-all duration-300 mb-4"
                        >
                          Quick Add to Cart
                        </button>
                      )}
                      <p className="text-blanc/90 text-sm px-4">
                        {collection.description}
                      </p>
                    </div>
                  </div>

                  {/* Purchase Badge */}
                  {isPurchased && (
                    <div className="absolute top-3 right-3 bg-sage text-blanc px-2 py-1 rounded-full text-xs font-medium">
                      Owned
                    </div>
                  )}
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
              Add collections to your cart and checkout with Stripe for instant access.
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