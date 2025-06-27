"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import type { Purchase, CollectionMedia } from '@prisma/client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type UserProfile = {
  role?: string;
};

type PurchaseWithMedia = Purchase & {
  media: CollectionMedia;
};

export default function AccountClient() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [purchases, setPurchases] = useState<PurchaseWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Check if user just logged in (redirected from auth callback)
        const fromAuth = searchParams?.get('fromAuth');
        if (fromAuth === 'true') {
          setShowWelcome(true);
          // Remove the query parameter
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Fetch the user's role from the 'users' table in the 'public' schema
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user profile:", error.message);
        } else {
          setProfile(data);
        }

        // Fetch purchases
        try {
          const res = await fetch('/api/user-purchases');
          const data = await res.json();
          if (res.ok) {
            setPurchases(data);
          }
        } catch (e) {
          console.error("Failed to fetch purchases", e);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [supabase, searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading account details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>You must be logged in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {showWelcome && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">
                Welcome back, {user.email}!
              </h3>
              <p className="mt-1 text-sm text-green-700">
                You have successfully signed in to your account.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setShowWelcome(false)}
                className="text-green-400 hover:text-green-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl font-serif">
          My Account
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          View your account details and manage your content.
        </p>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            User Information
          </h3>
          <div className="mt-5 border-t border-gray-200">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.email}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
                  {profile?.role || 'User'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {profile?.role === 'admin' && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Admin Access
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              As an admin, you have access to the content management system.
            </p>
            <Link href="/admin">
              <button className="bg-purple-600 text-white px-6 py-3 rounded-md text-sm font-semibold hover:bg-purple-700 transition-colors">
                Access Content Management
              </button>
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            My Purchases
          </h3>
          <div className="mt-5 border-t border-gray-200">
            {purchases.length > 0 ? (
              <ul role="list" className="divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <li key={purchase.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={purchase.media.thumbnailUrl || '/placeholder-thumbnail.jpg'}
                        alt={purchase.media.title}
                        className="w-16 h-16 rounded-md object-cover"
                      />
                      <div>
                        <p className="text-md font-medium text-gray-900">{purchase.media.title}</p>
                        {purchase.createdAt && (
                          <p className="text-sm text-gray-500">
                            Purchased on {new Date(purchase.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link href={`/watch/${purchase.media.id}`}>
                      <button className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-emerald-700 transition-colors">
                        Watch Now
                      </button>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 py-8">You have not made any purchases yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}