"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

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
  const [shouldPulse, setShouldPulse] = useState(false);
  const hasPulsedRef = useRef(false);

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

      // Use server-side verification endpoint
      let purchaseData: any[] = [];
      let attempts = 0;
      const maxAttempts = 3;
      const retryDelay = 2000; // 2 seconds

      while (attempts < maxAttempts && purchaseData.length === 0) {
        attempts++;
        console.log(`🔍 Verification attempt ${attempts}/${maxAttempts}`);

        try {
          const response = await fetch(`/api/purchases/verify?session_id=${encodeURIComponent(sessionId)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error(`❌ Verification failed (${response.status}):`, errorData.error);
            
            if (attempts < maxAttempts) {
              console.log(`⏳ Retrying in ${retryDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              continue;
            } else {
              setError(errorData.error || `Verification failed: ${response.status}`);
              setLoading(false);
              return;
            }
          }

          const result = await response.json();
          
          if (result.ok && result.purchases && result.purchases.length > 0) {
            console.log('✅ Server-side verification successful:', result.purchases.length, 'purchases found');
            purchaseData = result.purchases;
            break;
          } else {
            console.warn('⚠️ Verification returned no purchases:', result);
            if (result.error) {
              setError(result.error);
              setLoading(false);
              return;
            }
          }
        } catch (apiError: any) {
          console.error('API verification error:', apiError);
          if (attempts >= maxAttempts) {
            setError(apiError.message || 'Failed to verify purchases. Please try again.');
            setLoading(false);
            return;
          }
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      // Final check - if still no purchases, show error
      if (purchaseData.length === 0) {
        console.error('❌ No purchases found after all attempts');
        setError('Purchase verification is taking longer than expected. Please try refreshing the page in a few minutes.');
        setLoading(false);
        return;
      }

      console.log('✅ Purchase verification successful:', purchaseData.length, 'purchases found');

      // Clear cart after successful purchase
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('cart');
          // Dispatch event to notify other components that cart has been cleared
          window.dispatchEvent(new Event('cartUpdated'));
          console.log('🛒 Cart cleared after successful purchase');
        } catch (error) {
          console.warn('Failed to clear cart:', error);
        }
      }

      // Set purchases with collection data
      setPurchases(purchaseData.map(purchase => ({
        ...purchase,
        collection: purchase.collections || {
          id: purchase.collection_id,
          title: 'Unknown Collection',
          description: 'Collection details not available',
          price: purchase.amount_paid || 0
        }
      })));

      setLoading(false);
    } catch (err: any) {
      console.error('Purchase verification failed:', err);
      setError(err.message || 'Failed to verify purchases');
      setLoading(false);
    }
  };

  // Trigger pulse when terms are agreed
  useEffect(() => {
    if (agreedToTerms && !hasPulsedRef.current) {
      setShouldPulse(true);
      hasPulsedRef.current = true;
      // Stop pulsing after animation completes (3 pulses * 1s = 3s)
      setTimeout(() => setShouldPulse(false), 3000);
    }
  }, [agreedToTerms]);

  const handleTermsAgreement = () => {
    if (agreedToTerms) {
      // Store agreement in localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('exclusive-lex-purchase-terms-accepted', 'true');
        } catch (error) {
          console.warn('Failed to store terms agreement:', error);
        }
      }
      
      // Redirect to account page to view all purchases
      router.push('/account');
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

  const handleRetry = async () => {
    if (sessionId) {
      setError(null);
      setLoading(true);
      await verifyPurchases(sessionId);
    }
  };

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
          <p className="text-lex-brown mb-6">{error}</p>
          
          {/* Additional helpful information */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">What to do next:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check your email for a purchase confirmation</li>
              <li>• Your payment may have been processed successfully</li>
              <li>• Try refreshing this page in a few minutes</li>
              <li>• Contact support if you were charged but can't access content</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-lex-brown text-white px-6 py-3 rounded-lg hover:bg-lex-warmGray transition-all duration-200 font-semibold"
            >
              Retry Verification
            </button>
            
            <Link 
              href="/collections"
              className="block w-full bg-gray-200 text-lex-brown px-6 py-3 rounded-lg hover:bg-gray-300 transition-all duration-200 font-semibold text-center"
            >
              Return to Collections
            </Link>
          </div>
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
  const totalPrice = purchases.reduce((sum, purchase) => sum + (purchase.amount_paid || 0), 0);

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
            {purchases.map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-lex-brown mb-2">{purchase.collection.title}</h3>
                  <p className="text-gray-600">{purchase.collection.description}</p>
                </div>
                <div className="text-right ml-4">
                  <span className="text-2xl font-bold text-lex-brown">
                    ${(purchase.amount_paid || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            
            {isMultiplePurchases && (
              <div className="border-t-2 border-gray-200 pt-6 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-lex-brown">Total Amount</span>
                  <span className="text-3xl font-bold text-lex-brown">${totalPrice.toFixed(2)}</span>
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
              <label className="flex items-start space-x-4 cursor-pointer group hover:bg-gray-50 p-4 rounded-lg transition-all duration-200">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="termsCheckbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`
                    w-8 h-8 border-2 rounded-lg flex items-center justify-center transition-all duration-200
                    ${agreedToTerms 
                      ? 'bg-green-500 border-green-500 text-white shadow-lg' 
                      : 'bg-white border-gray-300 text-transparent hover:border-green-400'
                    }
                  `}>
                    {agreedToTerms && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-lg text-lex-brown leading-relaxed font-medium flex-1">
                  I have read, understood, and agree to all terms and conditions above. 
                  I confirm that I am 18 years or older and will use this content responsibly.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-6">
          {/* Microcopy above button */}
          {agreedToTerms && (
            <p className="text-lg text-lex-brown font-medium mb-2 animate-fade-in">
              Next step: view what you unlocked
            </p>
          )}
          
          <button
            onClick={handleTermsAgreement}
            disabled={!agreedToTerms}
            className={`
              relative px-12 py-4 rounded-xl text-xl font-semibold transition-all duration-200 shadow-lg
              focus:outline-none focus:ring-4 focus:ring-sage/50 focus:ring-offset-2
              min-h-[56px] min-w-[200px]
              ${agreedToTerms 
                ? `bg-sage text-white hover:bg-sage/90 transform hover:scale-105 shadow-xl 
                   ${shouldPulse ? 'animate-pulse-attention' : ''}
                   ring-2 ring-sage/30 ring-offset-2 ring-offset-almond` 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {agreedToTerms ? (
              <span className="flex items-center justify-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                View My Purchases
              </span>
            ) : (
              '☐ Accept Terms to Continue'
            )}
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
          
          <p className="text-sm text-gray-500 mt-4 text-center">
            You can access all your unlocked content from your <Link href="/account" className="underline">account page</Link>.
          </p>
          
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