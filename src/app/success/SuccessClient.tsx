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
  status: string;
  is_active: boolean;
  amount_paid: number;
  collection: {
    id: string;
    title: string;
    description: string;
    price: number;
  };
}

export default function SuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    verifyPurchases(sessionId);
  }, [sessionId]);

  const verifyPurchases = async (sessionId: string) => {
    try {
      console.log('🔍 Starting purchase verification for session:', sessionId);
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('No user session found');
        router.push('/login');
        return;
      }

      console.log('User authenticated:', session.user.id);

      // First, try to get completed purchases
      let { data: purchaseData, error } = await supabase
        .from('purchases')
        .select(`
          id,
          user_id,
          collection_id,
          stripe_session_id,
          created_at,
          status,
          is_active,
          amount_paid
        `)
        .eq('stripe_session_id', sessionId)
        .eq('user_id', session.user.id);

      console.log('Purchase query result:', { purchaseData, error });

      if (error) {
        console.error('Database error:', error);
        setError('Database error occurred');
        setLoading(false);
        return;
      }

      if (!purchaseData || purchaseData.length === 0) {
        console.log('No purchases found for session:', sessionId);
        setError('Purchase not found or access denied');
        setLoading(false);
        return;
      }

      // Check if any purchases are pending and complete them
      const pendingPurchases = purchaseData.filter(p => p.status === 'pending');
      if (pendingPurchases.length > 0) {
        console.log('Found pending purchases, completing them...');
        const { error: updateError } = await supabase
          .from('purchases')
          .update({ status: 'completed', is_active: true })
          .eq('stripe_session_id', sessionId)
          .eq('user_id', session.user.id)
          .eq('status', 'pending');
        
        if (updateError) {
          console.error('Failed to complete pending purchases:', updateError);
        } else {
          console.log('Successfully completed pending purchases');
          // Refresh the purchase data
          const { data: refreshedData } = await supabase
            .from('purchases')
            .select(`
              id,
              user_id,
              collection_id,
              stripe_session_id,
              created_at,
              status,
              is_active,
              amount_paid
            `)
            .eq('stripe_session_id', sessionId)
            .eq('user_id', session.user.id);
          
          if (refreshedData) {
            purchaseData = refreshedData;
          }
        }
      }

      // Get collection details for all purchases
      const collectionIds = purchaseData.map(p => p.collection_id);
      const { data: collections, error: collectionError } = await supabase
        .from('collections')
        .select('id, title, description, price')
        .in('id', collectionIds);

      if (collectionError || !collections) {
        console.error('Collections error:', collectionError);
        setError('Collections not found');
        setLoading(false);
        return;
      }

      // Combine the data
      const purchasesWithCollections = purchaseData.map(purchase => {
        const collection = collections.find(c => c.id === purchase.collection_id);
        return {
          ...purchase,
          collection: collection!
        };
      });

      console.log('Final purchases with collections:', purchasesWithCollections);

      setPurchases(purchasesWithCollections);
      
      // Calculate total amount
      const total = purchasesWithCollections.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
      setTotalAmount(total);
      
      setLoading(false);
    } catch (error) {
      console.error('Purchase verification error:', error);
      setError('Failed to verify purchase');
      setLoading(false);
    }
  };

  const handleTermsAgreement = () => {
    if (agreedToTerms) {
      // Store agreement in localStorage
      localStorage.setItem('exclusive-lex-purchase-terms-accepted', 'true');
      
      // Redirect to the first collection's watch page
      if (purchases.length > 0) {
        router.push(`/collections/${purchases[0].collection.id}/watch`);
      }
    }
  };

  const goToAccount = () => {
    router.push('/account');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-almond to-blanc flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lex-brown border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-serif text-lex-brown mb-2">Verifying Your Purchase</h2>
          <p className="text-lex-brown">Please wait while we confirm your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-almond to-blanc flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif text-lex-brown mb-4">Purchase Verification Failed</h1>
          <p className="text-lex-brown mb-8">{error}</p>
          <Link 
            href="/collections"
            className="inline-block bg-lex-brown text-white px-8 py-3 rounded-lg hover:bg-lex-warmGray transition-all duration-200 font-semibold"
          >
            Return to Collections
          </Link>
        </div>
      </div>
    );
  }

  if (!purchases.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-almond to-blanc flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-3xl font-serif text-lex-brown mb-4">Purchase Not Found</h1>
          <p className="text-lex-brown mb-8">You need to purchase collections to watch them.</p>
          <Link 
            href="/collections"
            className="inline-block bg-lex-brown text-white px-8 py-3 rounded-lg hover:bg-lex-warmGray transition-all duration-200 font-semibold"
          >
            Browse Collections
          </Link>
        </div>
      </div>
    );
  }

  const isMultiplePurchases = purchases.length > 1;
  const totalPrice = purchases.reduce((sum, purchase) => sum + ((purchase.collection.price || 0) / 100), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-almond to-blanc">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-5xl font-serif text-lex-brown mb-4">Purchase Successful!</h1>
          <p className="text-xl text-lex-brown mb-2">
            You now have permanent access to {isMultiplePurchases ? `${purchases.length} exclusive collections` : purchases[0].collection.title}
          </p>
          <p className="text-lex-brown opacity-75">
            Thank you for your support!
          </p>
        </div>

        {/* Purchased Collections */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <h2 className="text-3xl font-serif text-lex-brown mb-8 text-center">
            {isMultiplePurchases ? 'Your Purchased Collections' : 'Your Purchased Collection'}
          </h2>
          
          <div className="grid gap-6">
            {purchases.map((purchase, index) => (
              <div key={purchase.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-lex-brown mb-2">{purchase.collection.title}</h3>
                  <p className="text-gray-600">{purchase.collection.description}</p>
                </div>
                <div className="text-right ml-4">
                  <span className="text-2xl font-bold text-lex-brown">
                    ${((purchase.collection.price || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            
            {isMultiplePurchases && (
              <div className="border-t-2 border-gray-200 pt-6 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-lex-brown">Total Amount</span>
                  <span className="text-3xl font-bold text-lex-brown">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DMCA Agreement */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <h2 className="text-3xl font-serif text-lex-brown mb-8 text-center">Legal Agreement</h2>
          
          <div className="space-y-6 text-lex-brown">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-xl font-semibold mb-3 text-blue-800">DMCA Copyright Protection</h3>
              <p className="text-sm leading-relaxed text-blue-700">
                This content is protected by copyright laws and the Digital Millennium Copyright Act (DMCA). 
                You agree not to reproduce, distribute, or create derivative works without explicit permission. 
                Any unauthorized use may result in legal action.
              </p>
            </div>

            <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
              <h3 className="text-xl font-semibold mb-3 text-amber-800">Terms of Service</h3>
              <p className="text-sm leading-relaxed text-amber-700">
                This content is for personal, non-commercial use only. You may not share, sell, or redistribute 
                this content. You must be 18 years or older to access this material. By proceeding, you confirm 
                that you meet all age requirements and agree to these terms.
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-xl font-semibold mb-3 text-green-800">Privacy & Security</h3>
              <p className="text-sm leading-relaxed text-green-700">
                Your access is logged for security purposes. Any attempt to circumvent security measures, 
                download content without permission, or share access credentials will result in immediate 
                account termination and potential legal action.
              </p>
            </div>

            <div className="border-t-2 border-gray-200 pt-8">
              <label className="flex items-start space-x-4 cursor-pointer group">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`
                    w-8 h-8 border-2 rounded-lg flex items-center justify-center transition-all duration-200
                    ${agreedToTerms 
                      ? 'bg-lex-brown border-lex-brown shadow-lg' 
                      : 'border-gray-300 group-hover:border-lex-brown bg-white'
                    }
                  `}>
                    {agreedToTerms && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-lg text-lex-brown leading-relaxed font-medium">
                  I have read, understood, and agree to all terms and conditions above. 
                  I confirm that I am 18 years or older and will use this content responsibly.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-6">
          <button
            onClick={handleTermsAgreement}
            disabled={!agreedToTerms}
            className={`
              px-12 py-4 rounded-xl text-xl font-semibold transition-all duration-200 shadow-lg
              ${agreedToTerms 
                ? 'bg-lex-brown text-white hover:bg-lex-warmGray transform hover:scale-105 shadow-xl' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {agreedToTerms ? '🎬 Start Watching Now' : '☐ Accept Terms to Continue'}
          </button>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={goToAccount}
              className="px-8 py-3 rounded-xl text-lg font-semibold bg-white text-lex-brown hover:bg-gray-50 transition-all duration-200 border-2 border-lex-brown shadow-lg"
            >
              View All Purchases
            </button>
            
            <Link
              href="/collections"
              className="px-8 py-3 rounded-xl text-lg font-semibold bg-gray-200 text-lex-brown hover:bg-gray-300 transition-all duration-200 shadow-lg"
            >
              Browse More Collections
            </Link>
          </div>
          
          <p className="text-sm text-lex-brown opacity-75 mt-8">
            Purchase completed on {new Date(purchases[0].created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}