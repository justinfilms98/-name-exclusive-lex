"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Play, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

export default function SuccessClient() {
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<any>(null);
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
            duration
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-lex-brown text-lg">Verifying your purchase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-serif text-lex-brown mb-4">Purchase Verification Failed</h1>
          <p className="text-lex-brown mb-6">{error}</p>
          <Link 
            href="/collections"
            className="inline-block bg-lex-brown text-white px-6 py-3 rounded-lg hover:bg-lex-warmGray transition-colors"
          >
            Return to Collections
          </Link>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-lex-brown rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-serif text-lex-brown mb-4">Purchase Successful!</h1>
          <p className="text-lex-brown mb-6">Your purchase has been processed successfully.</p>
          <Link 
            href="/collections"
            className="inline-block bg-lex-brown text-white px-6 py-3 rounded-lg hover:bg-lex-warmGray transition-colors"
          >
            Browse More Collections
          </Link>
        </div>
      </div>
    );
  }

  const collection = purchase.collections;
  const expiresAt = new Date(purchase.expires_at);
  const timeLeft = Math.floor((expiresAt.getTime() - new Date().getTime()) / 1000);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-serif text-lex-brown mb-4">Purchase Successful!</h1>
        <p className="text-lex-brown text-lg mb-8">
          You now have access to <strong>{collection.title}</strong>
        </p>

        {/* Collection Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-serif text-lex-brown mb-4">{collection.title}</h2>
          <p className="text-lex-brown mb-4">{collection.description}</p>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-lex-brown">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>Duration: {formatDuration(collection.duration)}</span>
            </div>
            <div className="flex items-center">
              <span>Access expires in: {Math.floor(timeLeft / 3600)}h {Math.floor((timeLeft % 3600) / 60)}m</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/watch/${collection.id}`}
            className="inline-flex items-center justify-center bg-lex-brown text-white px-8 py-3 rounded-lg hover:bg-lex-warmGray transition-colors font-medium"
          >
            <Play className="w-5 h-5 mr-2" />
            Watch Now
          </Link>
          
          <Link
            href="/collections"
            className="inline-flex items-center justify-center bg-transparent border border-lex-brown text-lex-brown px-8 py-3 rounded-lg hover:bg-lex-brown hover:text-white transition-colors font-medium"
          >
            <ArrowRight className="w-5 h-5 mr-2" />
            Browse More
          </Link>
        </div>

        {/* Important Notice */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>Important:</strong> Your access is time-limited. Make sure to watch the content before it expires.
          </p>
        </div>
      </div>
    </div>
  );
}