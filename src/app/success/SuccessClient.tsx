"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Purchase {
  id: string;
  user_id: string;
  collection_id: string;
  stripe_session_id: string;
  created_at: string;
  collection: {
    id: string;
    title: string;
    description: string;
  };
}

export default function SuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    verifyPurchase(sessionId);
  }, [sessionId]);

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
          collection_id,
          stripe_session_id,
          created_at
        `)
        .eq('stripe_session_id', sessionId)
        .eq('user_id', session.user.id)
        .single();

      if (error || !purchaseData) {
        setError('Purchase not found or access denied');
        setLoading(false);
        return;
      }

      // Now get the collection details
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('id, title, description')
        .eq('id', purchaseData.collection_id)
        .single();

      if (collectionError || !collection) {
        setError('Collection not found');
        setLoading(false);
        return;
      }

      // Combine the data
      const purchaseWithCollection = {
        ...purchaseData,
        collection: collection
      };

      setPurchase(purchaseWithCollection);
      setLoading(false);
    } catch (error) {
      console.error('Purchase verification error:', error);
      setError('Failed to verify purchase');
      setLoading(false);
    }
  };

  const startWatching = () => {
    if (!purchase || !agreedToTerms) return;
    
    // Redirect to watch page with permanent access
    router.push(`/watch/${purchase.collection.id}?session_id=${purchase.stripe_session_id}`);
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
          <h1 className="text-2xl font-serif text-lex-brown mb-4">Purchase Not Found</h1>
          <p className="text-lex-brown mb-6">You need to purchase this collection to watch it.</p>
          <Link 
            href="/collections"
            className="inline-block bg-lex-brown text-white px-6 py-3 rounded-lg hover:bg-lex-warmGray transition-colors"
          >
            Browse Collections
          </Link>
        </div>
      </div>
    );
  }

  const collection = purchase.collection;

  return (
    <div className="min-h-screen bg-almond pt-20">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-green-600 text-3xl">✓</span>
          </div>
          <h1 className="text-4xl font-serif text-lex-brown mb-4">Purchase Successful!</h1>
          <p className="text-xl text-lex-brown mb-8">
            You now have permanent access to <strong>{collection.title}</strong>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-serif text-lex-brown mb-6">Legal Terms & DMCA Protection</h2>
          
          <div className="space-y-6 text-lex-brown">
            <div>
              <h3 className="text-lg font-semibold mb-3">DMCA Copyright Protection</h3>
              <p className="text-sm leading-relaxed">
                By accessing this content, you acknowledge that this material is protected by copyright laws. 
                You agree not to reproduce, distribute, or create derivative works without explicit permission. 
                Any unauthorized use may result in legal action under the Digital Millennium Copyright Act (DMCA).
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Terms of Service</h3>
              <p className="text-sm leading-relaxed">
                This content is for personal, non-commercial use only. You may not share, sell, or redistribute 
                this content. You must be 18 years or older to access this material. By proceeding, you confirm 
                that you meet all age requirements and agree to these terms.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Privacy & Security</h3>
              <p className="text-sm leading-relaxed">
                Your access is logged for security purposes. Any attempt to circumvent security measures, 
                download content without permission, or share access credentials will result in immediate 
                account termination and potential legal action.
              </p>
            </div>

            <div className="border-t pt-6">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-lex-brown border-gray-300 rounded focus:ring-lex-brown"
                />
                <span className="text-sm text-lex-brown">
                  I have read, understood, and agree to all terms and conditions above. 
                  I confirm that I am 18 years or older and will use this content responsibly.
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={startWatching}
            disabled={!agreedToTerms}
            className={`
              px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200
              ${agreedToTerms 
                ? 'bg-lex-brown text-white hover:bg-lex-warmGray transform hover:scale-105' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {agreedToTerms ? 'Start Watching Now' : 'Agree to Terms to Continue'}
          </button>
          
          <p className="text-sm text-lex-brown mt-4">
            Purchase completed on {new Date(purchase.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}