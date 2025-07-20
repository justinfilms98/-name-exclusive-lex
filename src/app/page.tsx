"use client";

import { useState, useEffect } from 'react';
import { getCollections, supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function HomePage() {
  const [collections, setCollections] = useState<any[]>([]);
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
        // Show only first 3 collections on home page
        setCollections(data.slice(0, 3));
      }
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-stone-800 to-stone-900 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-serif mb-6">Exclusive Lex</h1>
          <p className="text-xl text-stone-200 mb-8 max-w-2xl mx-auto">
            Premium video content with limited-time access. Discover exclusive collections crafted just for you.
          </p>
          <Link
            href="/collections"
            className="inline-block bg-white text-stone-800 px-8 py-3 rounded-md font-semibold hover:bg-stone-100 transition-colors"
          >
            Browse Collections
          </Link>
        </div>
      </div>

      {/* Featured Collections */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif text-stone-800 mb-4">Featured Collections</h2>
          <p className="text-stone-600">Handpicked exclusive content</p>
        </div>

        {collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {collections.map((collection) => (
              <div key={collection.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-video bg-stone-200 relative">
                  <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center">
                    <span className="text-stone-600 text-sm">Preview</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-stone-800 mb-2">
                    {collection.title}
                  </h3>
                  
                  <p className="text-stone-600 text-sm mb-4 line-clamp-2">
                    {collection.description}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-stone-800">
                      ${collection.price}
                    </span>
                    <span className="text-sm text-stone-500">
                      {Math.floor(collection.duration / 60)} min access
                    </span>
                  </div>
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
            <h3 className="text-xl font-medium text-stone-600 mb-2">No Collections Yet</h3>
            <p className="text-stone-500 mb-6">New exclusive content coming soon.</p>
            {user && (
              <Link
                href="/admin"
                className="inline-block bg-stone-800 text-white px-6 py-2 rounded-md hover:bg-stone-900 transition-colors"
              >
                Create Collection
              </Link>
            )}
          </div>
        )}

        <div className="text-center">
          <Link
            href="/collections"
            className="inline-block border border-stone-300 text-stone-700 px-8 py-3 rounded-md hover:bg-stone-50 transition-colors"
          >
            View All Collections
          </Link>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-stone-100 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif text-stone-800 mb-4">Ready to Get Started?</h2>
          <p className="text-stone-600 mb-8">
            {user ? 'Welcome back! Check out our latest collections.' : 'Sign in to access exclusive content and start your journey.'}
          </p>
          {!user && (
            <div className="text-stone-500 text-sm">
              Click "Sign In with Google" in the header to get started
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 