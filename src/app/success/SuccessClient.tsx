"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, ShoppingBag, Eye } from 'lucide-react';
import Link from 'next/link';

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    
    if (!sessionId) {
      router.push('/collections');
      return;
    }

    // Clear cart since purchase was successful
    localStorage.setItem('cart', JSON.stringify([]));
    window.dispatchEvent(new Event('cartUpdated'));

    // Simulate loading purchase details
    // In a real app, you'd verify the Stripe session and get purchase details
    setTimeout(() => {
      setLoading(false);
      // Mock purchase data - replace with actual Stripe session verification
      setPurchase({
        id: sessionId,
        total: 149.97,
        date: new Date().toLocaleDateString(),
      });
      
      // Mock collections - replace with actual purchased collections from database
      setCollections([
        { id: '1', title: 'Midnight Sessions', price: 24.99 },
        { id: '2', title: 'Golden Hour Chronicles', price: 34.99 },
        { id: '3', title: 'Exclusive Studio Sessions', price: 49.99 },
      ]);
    }, 1500);

  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-pearl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-salmon mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold mb-2">Processing Your Purchase</h2>
          <p className="text-green">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-salmon mx-auto" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-pearl mb-4">
          Purchase Successful!
        </h1>
        <p className="text-xl text-green max-w-2xl mx-auto">
          Thank you for your purchase. You now have exclusive access to your selected collections.
        </p>
      </div>

      {/* Purchase Summary */}
      <div className="bg-pearl bg-opacity-10 backdrop-blur-sm rounded-lg border border-pearl border-opacity-20 p-8 mb-8">
        <h2 className="text-2xl font-semibold text-pearl mb-6 flex items-center">
          <ShoppingBag className="w-6 h-6 mr-3 text-salmon" />
          Purchase Summary
        </h2>

        <div className="space-y-4 mb-6">
          {collections.map((collection) => (
            <div key={collection.id} className="flex justify-between items-center py-3 border-b border-pearl border-opacity-10 last:border-b-0">
              <div>
                <h3 className="text-pearl font-medium">{collection.title}</h3>
                <p className="text-green text-sm">Exclusive access granted</p>
              </div>
              <div className="text-salmon font-semibold">
                ${collection.price}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-pearl border-opacity-20 pt-4">
          <div className="flex justify-between items-center text-xl font-bold">
            <span className="text-pearl">Total Paid</span>
            <span className="text-salmon">${purchase?.total}</span>
          </div>
          <p className="text-cyan text-sm mt-1">
            Transaction ID: {purchase?.id}
          </p>
          <p className="text-cyan text-sm">
            Date: {purchase?.date}
          </p>
        </div>
      </div>

      {/* Access Instructions */}
      <div className="bg-cyan bg-opacity-10 border border-cyan border-opacity-30 rounded-lg p-6 mb-8">
        <h3 className="text-cyan font-semibold mb-3 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          How to Access Your Content
        </h3>
        <div className="text-green text-sm space-y-2">
          <p>• Your purchased collections are now available in your account</p>
          <p>• Access is time-limited based on each collection's duration</p>
          <p>• Watch videos anytime during your access period</p>
          <p>• All content is protected and cannot be downloaded</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/collections"
          className="btn-primary px-8 py-3 rounded-full font-medium text-lg text-center"
        >
          Browse More Collections
        </Link>
        <Link
          href="/account"
          className="btn-secondary px-8 py-3 rounded-full font-medium text-lg text-center"
        >
          View My Account
        </Link>
      </div>

      {/* Support Info */}
      <div className="text-center mt-12">
        <p className="text-green text-sm">
          Questions about your purchase? Contact us at{' '}
          <span className="text-salmon">contact.exclusivelex@gmail.com</span>
        </p>
      </div>
    </div>
  );
}