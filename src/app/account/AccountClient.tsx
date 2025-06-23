"use client";
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import type { Purchase, CollectionMedia } from '@prisma/client';
import Link from 'next/link';

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
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
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
  }, [supabase]);

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