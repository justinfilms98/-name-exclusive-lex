"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, ShoppingBag, Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PurchaseData {
  id: string;
  collection_id: string;
  amount_paid: number;
  expires_at: string;
  created_at: string;
  collections: {
    id: string;
    title: string;
    description: string;
  };
}

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    
    if (!sessionId) {
      router.push('/collections');
      return;
    }

    loadPurchaseData(sessionId);
  }, [searchParams, router]);

  const loadPurchaseData = async (sessionId: string) => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Clear cart since purchase was successful
      localStorage.setItem('cart', JSON.stringify([]));
      window.dispatchEvent(new Event('cartUpdated'));

      // Get purchases for this Stripe session
      const { data: purchaseData, error } = await supabase
        .from('purchases')
        .select(`
          *,
          collections (
            id,
            title,
            description
          )
        `)
        .eq('stripe_session_id', sessionId)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Failed to load purchase data:', error);
        // Still show success page even if we can't load details
      } else if (purchaseData) {
        setPurchases(purchaseData);
      }

    } catch (error) {
      console.error('Error loading purchase data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return purchases.reduce((total, purchase) => total + purchase.amount_paid, 0);
  };

  const formatExpiration = (expiresAt: string) => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m remaining`;
    } else {
      return 'Expired';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 spinner mx-auto mb-6"></div>
          <h2 className="heading-2 mb-2">Confirming Your Purchase</h2>
          <p className="text-sage">Please wait while we process your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-sage mx-auto" />
        </div>
        <h1 className="heading-1 mb-4 text-shadow">
          Purchase Successful!
        </h1>
        <p className="body-large text-sage max-w-2xl mx-auto">
          Thank you for your purchase. You now have exclusive access to your selected collections.
        </p>
      </div>

      {/* Purchase Summary */}
      {purchases.length > 0 && (
        <div className="card-glass p-8 mb-8">
          <h2 className="heading-3 mb-6 flex items-center">
            <ShoppingBag className="w-6 h-6 mr-3 text-sage" />
            Purchase Summary
          </h2>

          <div className="space-y-4 mb-6">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="flex justify-between items-start py-4 border-b border-mushroom/20 last:border-b-0">
                <div className="flex-1">
                  <h3 className="text-earth font-serif text-lg mb-1">
                    {purchase.collections.title}
                  </h3>
                  <p className="text-sage text-sm mb-2">
                    {purchase.collections.description}
                  </p>
                  <p className="text-khaki text-xs">
                    Access expires: {formatExpiration(purchase.expires_at)}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-earth font-bold text-lg">
                    ${purchase.amount_paid.toFixed(2)}
                  </div>
                  <Link
                    href={`/watch/${purchase.collection_id}`}
                    className="inline-flex items-center text-sage hover:text-khaki transition-colors text-sm mt-2"
                  >
                    Watch Now
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-mushroom/30 pt-4">
            <div className="flex justify-between text-xl font-bold text-earth">
              <span>Total Paid</span>
              <span>${getTotalAmount().toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Access Instructions */}
      <div className="card bg-sage/10 border-sage/30 p-6 mb-8">
        <h3 className="text-sage font-serif text-lg mb-3 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          How to Access Your Content
        </h3>
        <div className="text-earth text-sm space-y-2">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-sage rounded-full mr-3 mt-2"></div>
            <span>Your purchased collections are now available in your account</span>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-sage rounded-full mr-3 mt-2"></div>
            <span>Access is time-limited based on each collection's duration</span>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-sage rounded-full mr-3 mt-2"></div>
            <span>Watch videos and view photos anytime during your access period</span>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-sage rounded-full mr-3 mt-2"></div>
            <span>All content is protected and cannot be downloaded</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        {purchases.length > 0 && (
          <Link
            href={`/watch/${purchases[0].collection_id}`}
            className="btn-primary"
          >
            Start Watching
          </Link>
        )}
        <Link
          href="/collections"
          className="btn-secondary"
        >
          Browse More Collections
        </Link>
        <Link
          href="/account"
          className="btn-ghost"
        >
          View My Account
        </Link>
      </div>

      {/* Support Info */}
      <div className="text-center">
        <p className="text-sage text-sm">
          Questions about your purchase? Contact us at{' '}
          <span className="text-khaki font-medium">contact.exclusivelex@gmail.com</span>
        </p>
      </div>
    </div>
  );
}