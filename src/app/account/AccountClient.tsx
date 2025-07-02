"use client";
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import type { Purchase, CollectionVideo } from '@prisma/client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type PurchaseWithMedia = Purchase & {
  media: CollectionVideo;
};

export default function AccountClient() {
  const sessionHook = useSession();
  const session = sessionHook?.data;
  const status = sessionHook?.status;
  const [purchases, setPurchases] = useState<PurchaseWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      
      if (session?.user) {
        // Check if user just logged in (redirected from auth callback)
        const fromAuth = searchParams?.get('fromAuth');
        if (fromAuth === 'true') {
          setShowWelcome(true);
          // Remove the query parameter
          window.history.replaceState({}, document.title, window.location.pathname);
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

    if (status !== 'loading') {
      fetchUserData();
    }
  }, [session, status, searchParams]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-stone-800 mb-4">Please Sign In</h2>
          <Link 
            href="/login"
            className="bg-stone-800 text-white px-6 py-3 rounded-md hover:bg-stone-900 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Welcome Message */}
        {showWelcome && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-8">
            <h3 className="text-emerald-800 font-semibold">Welcome back!</h3>
            <p className="text-emerald-700 text-sm">You've successfully signed in to your account.</p>
          </div>
        )}

        {/* User Profile */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-serif text-stone-800 mb-2">My Account</h1>
              <p className="text-stone-600">{session?.user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-stone-800 text-white px-4 py-2 rounded-md hover:bg-stone-900 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {session?.user?.role === 'admin' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-blue-800 font-semibold mb-2">Admin Access</h3>
              <p className="text-blue-700 text-sm mb-3">You have administrative privileges.</p>
              <Link 
                href="/admin"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Go to Admin Dashboard
              </Link>
            </div>
          )}
        </div>

        {/* Purchase History */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-serif text-stone-800 mb-6">Purchase History</h2>
          
          {purchases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-stone-600 mb-4">You haven't made any purchases yet.</p>
              <Link 
                href="/collections"
                className="bg-stone-800 text-white px-6 py-3 rounded-md hover:bg-stone-900 transition-colors"
              >
                Browse Collections
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="border border-stone-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-stone-800">{purchase.media.title}</h3>
                      <p className="text-stone-600 text-sm">{purchase.media.description}</p>
                      <p className="text-stone-500 text-sm">
                        Purchased: {(() => {
                          let createdAtDate: Date | null = null;
                          if (purchase.createdAt instanceof Date) {
                            createdAtDate = purchase.createdAt;
                          } else if (typeof purchase.createdAt === 'string' || typeof purchase.createdAt === 'number') {
                            createdAtDate = new Date(purchase.createdAt);
                          }
                          return createdAtDate ? createdAtDate.toLocaleDateString() : 'Unknown';
                        })()}
                      </p>
                      {purchase.expiresAt && (() => {
                        let expiresAtDate: Date | null = null;
                        if (purchase.expiresAt instanceof Date) {
                          expiresAtDate = purchase.expiresAt;
                        } else if (typeof purchase.expiresAt === 'string' || typeof purchase.expiresAt === 'number') {
                          expiresAtDate = new Date(purchase.expiresAt);
                        }
                        return expiresAtDate ? (
                          <p className="text-stone-500 text-sm">
                            Expires: {expiresAtDate.toLocaleDateString()}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div className="mt-2">
                    {(() => {
                      let expiresAtDate: Date | null = null;
                      if (purchase.expiresAt instanceof Date) {
                        expiresAtDate = purchase.expiresAt;
                      } else if (typeof purchase.expiresAt === 'string' || typeof purchase.expiresAt === 'number') {
                        expiresAtDate = new Date(purchase.expiresAt);
                      }
                      if (expiresAtDate && expiresAtDate > new Date()) {
                        return (
                          <Link 
                            href={`/watch/${purchase.media.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            Watch Now
                          </Link>
                        );
                      }
                      return <span className="text-red-600 text-sm">Expired</span>;
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}