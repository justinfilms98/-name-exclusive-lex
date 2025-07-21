"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Play, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Purchase {
  id: string;
  user_id: string;
  collection_id: string;
  stripe_session_id: string;
  purchased_at: string;
  expires_at: string;
  collections: {
    id: string;
    title: string;
    description: string;
    duration: number;
    price: number;
  };
}

export default function SuccessPage() {
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    verifyPurchase(sessionId);
  }, [searchParams]);

  const verifyPurchase = async (sessionId: string) => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      // Find the purchase record
      const { data: purchaseData, error } = await supabase
        .from('purchases')
        .select(`
          *,
          collections (
            id,
            title,
            description,
            duration,
            price
          )
        `)
        .eq('stripe_session_id', sessionId)
        .eq('user_id', session.user.id)
        .single();

      if (error || !purchaseData) {
        setError('Purchase not found or access denied');
        setLoading(false);
        return;
      }

      setPurchase(purchaseData);
      setLoading(false);
    } catch (error) {
      console.error('Purchase verification error:', error);
      setError('Failed to verify purchase');
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minutes`;
  };

  const handleStartWatching = () => {
    if (purchase) {
      router.push(`/watch?session_id=${purchase.stripe_session_id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-stone-600 text-lg">Verifying your purchase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-800 mb-2">Verification Failed</h1>
          <p className="text-stone-600 mb-6">{error}</p>
          <Link
            href="/collections"
            className="inline-flex items-center px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-semibold text-stone-800 mb-2">Purchase Not Found</h1>
          <p className="text-stone-600 mb-6">The requested purchase could not be found.</p>
          <Link
            href="/collections"
            className="inline-flex items-center px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-stone-800 mb-4">Payment Successful!</h1>
          <p className="text-xl text-stone-600">Thank you for your purchase. Your exclusive content is ready.</p>
        </div>

        {/* Purchase Details */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold text-stone-800 mb-4">
                {purchase.collections.title}
              </h2>
              <p className="text-stone-600 mb-6">{purchase.collections.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center text-stone-600">
                  <Clock className="w-5 h-5 mr-3" />
                  <span>Duration: {formatDuration(purchase.collections.duration)}</span>
                </div>
                <div className="flex items-center text-stone-600">
                  <CheckCircle className="w-5 h-5 mr-3" />
                  <span>Access: Limited Time</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-stone-800 mb-4">What's Next?</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">Click "Start Watching"</p>
                    <p className="text-sm text-stone-600">Begin your exclusive experience</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">Timer Starts</p>
                    <p className="text-sm text-stone-600">Your limited-time access begins</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">Enjoy & Return</p>
                    <p className="text-sm text-stone-600">Access expires automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <button
            onClick={handleStartWatching}
            className="inline-flex items-center px-8 py-4 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors text-lg font-semibold"
          >
            <Play className="w-5 h-5 mr-3" />
            Start Watching Now
          </button>
          
          <div className="text-sm text-stone-500">
            <p>Your timer will start when you begin watching</p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">Important Notice</h4>
              <p className="text-yellow-700 text-sm">
                Your access is time-limited. Once you start watching, the timer begins and cannot be paused. 
                Make sure you have uninterrupted time to enjoy your exclusive content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 