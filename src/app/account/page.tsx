"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Clock, Video, Shield, LogOut, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Purchase {
  id: string;
  collection_id: string;
  amount_paid: number;
  created_at: string;
  stripe_session_id: string;
  collections: {
    id: string;
    title: string;
    description: string;
  };
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Load user purchases
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
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && purchaseData) {
        setPurchases(purchaseData);
      }

    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      localStorage.setItem('cart', JSON.stringify([]));
      window.dispatchEvent(new Event('cartUpdated'));
      router.push('/');
    }
  };

  // All purchases are now permanent - no expiration logic needed
  const getActivePurchases = () => {
    return purchases; // All purchases are active
  };

  const getExpiredPurchases = () => {
    return []; // No expired purchases since all are permanent
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-almond pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Loading account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activePurchases = getActivePurchases();
  const expiredPurchases = getExpiredPurchases();

  return (
    <div className="min-h-screen bg-almond pt-20">
      <div className="max-w-4xl mx-auto px-4 py-16">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-1 mb-2">My Account</h1>
            <p className="text-sage">Manage your exclusive content access</p>
          </div>
          
          <button
            onClick={handleSignOut}
            className="btn-ghost flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* User Info */}
        <div className="card-glass p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-sage" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-earth mb-1">{user.email}</h2>
              <p className="text-sage text-sm">Member since {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Active Purchases */}
        <div className="mb-8">
          <h2 className="heading-3 mb-4 flex items-center">
            <Video className="w-6 h-6 mr-2 text-sage" />
            Active Access ({activePurchases.length})
          </h2>

          {activePurchases.length === 0 ? (
            <div className="card p-8 text-center">
              <Clock className="w-12 h-12 text-sage mx-auto mb-4" />
              <h3 className="text-lg font-medium text-earth mb-2">No Active Access</h3>
              <p className="text-sage mb-6">Browse our collections to purchase exclusive content.</p>
              <Link href="/collections" className="btn-primary">
                Browse Collections
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activePurchases.map((purchase) => (
                <div key={purchase.id} className="card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-serif text-earth mb-1">
                        {purchase.collections.title}
                      </h3>
                      <p className="text-sage text-sm mb-2">
                        {purchase.collections.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-sage">
                        <span>Purchased: {new Date(purchase.created_at).toLocaleDateString()}</span>
                        <span>Paid: ${purchase.amount_paid.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="ml-6 text-right">
                      <div className="text-sm text-sage mb-2">
                        Permanent Access
                      </div>
                      <Link
                        href={`/watch/${purchase.collection_id}?session_id=${purchase.stripe_session_id}`}
                        className="btn-primary text-sm flex items-center space-x-2"
                      >
                        <span>Watch Now</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="card-glass p-6">
          <h3 className="text-lg font-serif text-earth mb-4">Account Actions</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/collections" className="btn-primary">
              Browse Collections
            </Link>
            <Link href="/cart" className="btn-secondary">
              View Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
