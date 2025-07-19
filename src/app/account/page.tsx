"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getUserPurchases } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);
      
      // Get user purchases
      const { data: purchaseData, error } = await getUserPurchases(session.user.id);
      if (!error && purchaseData) {
        setPurchases(purchaseData);
      }
      
      setLoading(false);
    };

    getUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userIsAdmin = isAdmin(user.email!);

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-serif text-stone-800 mb-2">My Account</h1>
              <p className="text-stone-600">{user.email}</p>
              <p className="text-sm text-stone-500">Role: {userIsAdmin ? 'Admin' : 'User'}</p>
            </div>
            
            {userIsAdmin && (
              <Link
                href="/admin"
                className="bg-stone-800 text-white px-4 py-2 rounded-md hover:bg-stone-900 transition-colors"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-stone-800 mb-4">My Purchases</h2>
          
          {purchases.length > 0 ? (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="border border-stone-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-stone-800">
                        {purchase.collections?.title || 'Untitled Collection'}
                      </h3>
                      <p className="text-stone-600 text-sm">
                        {purchase.collections?.description}
                      </p>
                      <p className="text-stone-500 text-sm mt-1">
                        Purchased: {new Date(purchase.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-stone-500 text-sm">
                        Expires: {new Date(purchase.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-stone-800">
                        ${purchase.collections?.price}
                      </p>
                      
                      {new Date(purchase.expires_at) > new Date() ? (
                        <Link
                          href={`/collections/${purchase.collection_id}/watch`}
                          className="inline-block mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Watch Now
                        </Link>
                      ) : (
                        <span className="inline-block mt-2 bg-gray-400 text-white px-3 py-1 rounded text-sm">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-stone-500 mb-4">No purchases yet</p>
              <Link
                href="/collections"
                className="bg-stone-800 text-white px-6 py-2 rounded-md hover:bg-stone-900 transition-colors"
              >
                Browse Collections
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
