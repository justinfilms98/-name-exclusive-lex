"use client";

import { useState, useEffect } from 'react';
import { getCollections, supabase } from '@/lib/supabase';
import { ShoppingCart, Clock, Image as ImageIcon } from 'lucide-react';

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
        setTimeout(() => button.classList.remove('cart-bounce'), 500);
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min access`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand pt-20 flex items-center justify-center">
        <div className="text-center text-pearl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-salmon mx-auto mb-4"></div>
          <p className="text-green">Loading collections...</p>
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="min-h-screen bg-sand pt-20">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center py-16">
            <div className="text-salmon mb-4">
              <ImageIcon className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-pearl mb-4">No Collections Available</h2>
            <p className="text-green mb-8">New exclusive content coming soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand pt-20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-pearl mb-4">Exclusive Collections</h1>
          <p className="text-xl text-green max-w-2xl mx-auto">
            Premium content with limited-time access. Each collection offers exclusive behind-the-scenes experiences.
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="masonry-grid">
          {collections.map((collection, index) => {
            // Vary card heights for masonry effect
            const heights = ['h-64', 'h-72', 'h-80', 'h-56', 'h-68'];
            const cardHeight = heights[index % heights.length];
            
            return (
              <div
                key={collection.id}
                className={`masonry-item bg-pearl bg-opacity-10 backdrop-blur-sm rounded-lg overflow-hidden border border-pearl border-opacity-20 ${cardHeight}`}
              >
                {/* Thumbnail */}
                <div className="relative h-2/3 bg-gradient-to-br from-salmon to-cyan opacity-80 group">
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-pearl group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        id={`cart-btn-${collection.id}`}
                        onClick={() => addToCart(collection)}
                        className="bg-salmon hover:bg-cyan text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Title Overlay - Fades on hover */}
                  <div className="masonry-title absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <h3 className="text-pearl font-semibold text-lg">
                      {collection.title}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 h-1/3 flex flex-col justify-between">
                  <p className="text-green text-sm line-clamp-2 mb-2">
                    {collection.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-cyan">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(collection.duration)}
                    </div>
                    <div className="text-xs text-green">
                      {collection.photo_paths?.length || 0} photos
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-2xl font-bold text-salmon">
                    ${collection.price}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-pearl bg-opacity-5 backdrop-blur-sm rounded-lg border border-pearl border-opacity-20 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-serif text-pearl mb-4">Ready to Get Exclusive Access?</h2>
            <p className="text-green mb-6">
              Add collections to your cart and checkout with Stripe for instant access.
            </p>
            {!user && (
              <p className="text-salmon text-sm">
                Sign in to add items to your cart and make purchases.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 