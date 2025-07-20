"use client";

import React from 'react';
import Link from 'next/link';
import { Heart, PlayCircle, Lock } from 'lucide-react';
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

interface CollectionsClientProps {
  collections: Collection[];
  user: any;
}

export default function CollectionsClient({ collections, user }: CollectionsClientProps) {
  const router = useRouter();

  const handlePurchase = async (collectionId: string, price: number) => {
    if (!user) {
      router.push('/login');
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
          priceId: price,
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min access`;
  };

  if (collections.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center py-16">
            <div className="text-stone-400 mb-4">
              <PlayCircle className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-stone-600 mb-4">No Collections Available</h2>
            <p className="text-stone-500 mb-8">New exclusive content coming soon.</p>
            {user && (
              <Link
                href="/admin"
                className="inline-block bg-stone-800 text-white px-6 py-2 rounded hover:bg-stone-900 transition-colors"
              >
                Create Collection
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif text-stone-800 mb-4">Exclusive Collections</h1>
          <p className="text-xl text-stone-600 max-w-2xl mx-auto">
            Premium video content with limited-time access. Each collection offers exclusive behind-the-scenes content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection, index) => (
            <div
              key={collection.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-stone-200 relative group">
                <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center">
                  <PlayCircle className="w-16 h-16 text-stone-600 group-hover:text-stone-700 transition-colors" />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <PlayCircle className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-stone-800 mb-2">
                  {collection.title}
                </h3>
                
                <p className="text-stone-600 text-sm mb-4 line-clamp-3">
                  {collection.description}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm text-stone-500 mb-4">
                  <span className="flex items-center">
                    <Lock className="w-4 h-4 mr-1" />
                    {formatDuration(collection.duration)}
                  </span>
                  <span>{collection.photo_paths?.length || 0} photos</span>
                </div>

                {/* Price and Action */}
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-stone-800">
                    ${collection.price}
                  </div>
                  
                  <button
                    onClick={() => handlePurchase(collection.id, collection.price)}
                    className="bg-stone-800 text-white px-6 py-2 rounded hover:bg-stone-900 transition-colors font-medium"
                  >
                    {user ? 'Purchase' : 'Sign In to Purchase'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-serif text-stone-800 mb-4">Want More Exclusive Content?</h2>
            <p className="text-stone-600 mb-6">
              New collections are added regularly. Follow for updates on the latest exclusive releases.
            </p>
            {!user && (
              <Link
                href="/login"
                className="inline-block bg-stone-800 text-white px-8 py-3 rounded hover:bg-stone-900 transition-colors font-medium"
              >
                Sign In for Access
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 