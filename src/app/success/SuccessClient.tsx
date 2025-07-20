"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Download, Play, Clock } from 'lucide-react';
import Link from 'next/link';

interface PurchaseData {
  id: string;
  media: {
    id: string;
    title: string;
    description?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
  };
  amountPaid: number;
  expiresAt: string;
  createdAt: string;
}

export default function SuccessClient() {
  const [user, setUser] = useState<any>(null);
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/');
          return;
        }
        
        setUser(session.user);
        
        // Get session_id from URL
        const sessionId = searchParams?.get('session_id');
        if (!sessionId) {
          setError('Missing session ID');
          setLoading(false);
          return;
        }

        // TODO: Verify purchase with Stripe session
        // For now, show success message
        setPurchase({
          id: 'mock-purchase-id',
          media: {
            id: 'mock-media-id',
            title: 'Your Purchase',
            description: 'Thank you for your purchase!'
          },
          amountPaid: 0,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        });
        
      } catch (err) {
        console.error('Error loading purchase data:', err);
        setError('Failed to load purchase data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-stone-800 mb-2">Something went wrong</h1>
          <p className="text-stone-600 mb-6">{error || 'Unable to verify your purchase'}</p>
          <Link
            href="/collections"
            className="inline-block bg-stone-800 text-white px-6 py-2 rounded hover:bg-stone-900 transition-colors"
          >
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-500 mb-6">
            <CheckCircle className="w-16 h-16 mx-auto" />
          </div>
          
          <h1 className="text-3xl font-bold text-stone-800 mb-4">
            Purchase Successful!
          </h1>
          
          <p className="text-stone-600 mb-8">
            Thank you for your purchase. You now have access to exclusive content.
          </p>

          {purchase && (
            <div className="bg-stone-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-stone-800 mb-4">
                {purchase.media.title}
              </h2>
              
              {purchase.media.description && (
                <p className="text-stone-600 mb-4">
                  {purchase.media.description}
                </p>
              )}
              
              <div className="flex items-center justify-center space-x-4 text-sm text-stone-500 mb-6">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  24-hour access
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Link
              href="/collections"
              className="block w-full bg-stone-800 text-white py-3 px-6 rounded hover:bg-stone-900 transition-colors"
            >
              Browse More Collections
            </Link>
            
            <Link
              href="/account"
              className="block w-full border border-stone-300 text-stone-700 py-3 px-6 rounded hover:bg-stone-50 transition-colors"
            >
              View My Purchases
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}