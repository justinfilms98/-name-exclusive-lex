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

      // First get the purchase record
      const { data: purchaseData, error } = await supabase
        .from('purchases')
        .select(`
          id,
          user_id,
          collection_video_id,
          stripe_session_id,
          created_at,
          expires_at
        `)
        .eq('stripe_session_id', sessionId)
        .eq('user_id', session.user.id)
        .single();

      if (error || !purchaseData) {
        setError('Purchase not found or access denied');
        setLoading(false);
        return;
      }

      // Now get the collection video details
      const { data: collectionVideo, error: videoError } = await supabase
        .from('CollectionVideo')
        .select('id, title, description, price')
        .eq('id', purchaseData.collection_video_id)
        .single();

      if (videoError || !collectionVideo) {
        setError('Collection video not found');
        setLoading(false);
        return;
      }

      // Combine the data
      const purchaseWithVideo = {
        ...purchaseData,
        CollectionVideo: collectionVideo
      };

      setPurchase(purchaseWithVideo);
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

  const formatAccessTime = (): string => {
    return "30 minutes";
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

  const collection = purchase.CollectionVideo;
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
              <span>Video Duration: {formatDuration(collection.price * 60)}</span>
            </div>
            <div className="flex items-center">
              <span>Access expires in: {Math.floor(timeLeft / 3600)}h {Math.floor((timeLeft % 3600) / 60)}m</span>
            </div>
          </div>
        </div>

        {/* Access Time Warning */}
        <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-4">
            <div className="text-yellow-600 mt-1">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-yellow-800">
              <h3 className="font-bold text-lg mb-2">Important: Time-Limited Access</h3>
              <p className="mb-2">You have <strong>{formatAccessTime()}</strong> to watch your purchased content once you start viewing.</p>
              <p className="text-sm">Make sure you have uninterrupted time to enjoy your exclusive collection before the access expires.</p>
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
            <strong>Reminder:</strong> Your access is time-limited to {formatAccessTime()}. Make sure to watch the content before it expires.
          </p>
        </div>
      </div>
    </div>
  );
}