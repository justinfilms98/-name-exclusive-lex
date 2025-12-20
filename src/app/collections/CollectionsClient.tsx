"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { PlayCircle, Lock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';
import PurchaseDisclaimer from '@/components/PurchaseDisclaimer';
import type { User } from '@supabase/supabase-js';

interface Collection {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail_path: string;
  photo_paths: string[];
  created_at: string;
}

interface CollectionsClientProps {
  collections: Collection[];
  user: User | null;
}

export default function CollectionsClient({ collections, user }: CollectionsClientProps) {
  const router = useRouter();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const handlePurchaseClick = (collection: Collection) => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    setSelectedCollection(collection);
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedCollection) return;
    
    setPurchaseLoading(true);
    
    try {
      // Get the user's session token with better mobile handling
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, redirecting to login');
        router.push('/login');
        return;
      }
      
      // Validate the session is still valid
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('Invalid session, redirecting to login');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'User-Agent': navigator.userAgent,
        },
        body: JSON.stringify({
          collectionId: selectedCollection.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      if (sessionId) {
        // Use direct URL redirect for better mobile compatibility
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        if (stripe) {
          try {
            const { error } = await stripe.redirectToCheckout({ sessionId });
            if (error) {
              console.error('Stripe checkout error:', error);
              // Fallback to direct URL redirect
              window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
            }
          } catch (redirectError) {
            console.error('Redirect error:', redirectError);
            // Fallback to direct URL redirect
            window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
          }
        } else {
          // Fallback if Stripe fails to load
          window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setPurchaseLoading(false);
      setShowPurchaseModal(false);
      setSelectedCollection(null);
    }
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
            Premium video content with permanent access. Each collection offers exclusive behind-the-scenes content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection) => (
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
                    Permanent Access
                  </span>
                  <span>{collection.photo_paths?.length || 0} photos</span>
                </div>

                {/* Price and Action */}
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-stone-800">
                    ${(collection.price / 100).toFixed(2)}
                  </div>
                  
                  <button
                    onClick={() => handlePurchaseClick(collection)}
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

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-stone-800">Confirm Purchase</h2>
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-stone-800 mb-2">
                  {selectedCollection.title}
                </h3>
                <p className="text-stone-600 text-sm mb-4">
                  {selectedCollection.description}
                </p>
                <div className="flex items-center justify-between text-sm text-stone-500">
                  <span>Permanent Access</span>
                  <span className="text-lg font-bold text-stone-800">
                    ${(selectedCollection.price / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Purchase Disclaimer */}
              <PurchaseDisclaimer variant="checkout" className="mb-6" />

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  disabled={purchaseLoading}
                  className="flex-1 px-4 py-2 bg-stone-800 text-white rounded hover:bg-stone-900 transition-colors disabled:opacity-50"
                >
                  {purchaseLoading ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 