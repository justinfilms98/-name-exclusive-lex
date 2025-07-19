"use client";

import { useState, useEffect } from 'react';
import { getCollections, supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

interface Collection {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  thumbnail_path: string;
  created_at: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
  }, []);

  const handlePurchase = async (collectionId: string, price: number) => {
    if (!user) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId,
          price,
          userId: user.id,
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif text-stone-800 mb-4">Exclusive Collections</h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Premium video content with limited-time access. Purchase once, enjoy for the duration specified.
          </p>
        </div>

        {collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection) => (
              <div key={collection.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-video bg-stone-200 relative">
                  {collection.thumbnail_path && (
                    <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center">
                      <span className="text-stone-600 text-sm">Thumbnail</span>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-stone-800 mb-2">
                    {collection.title}
                  </h3>
                  
                  <p className="text-stone-600 text-sm mb-4 line-clamp-3">
                    {collection.description}
                  </p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-2xl font-bold text-stone-800">
                        ${collection.price}
                      </span>
                    </div>
                    <div className="text-sm text-stone-500">
                      {Math.floor(collection.duration / 60)} min access
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handlePurchase(collection.id, collection.price)}
                    className="w-full bg-stone-800 text-white py-2 px-4 rounded-md hover:bg-stone-900 transition-colors font-medium"
                  >
                    {user ? 'Purchase Access' : 'Sign In to Purchase'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-stone-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-stone-600 mb-2">No Collections Available</h3>
            <p className="text-stone-500">New exclusive content coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
} 