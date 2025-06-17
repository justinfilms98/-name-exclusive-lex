"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

interface Purchase {
  id: string;
  video_id: number;
  created_at: string;
  expires_at: string;
  video: {
    title: string;
    thumbnail: string;
    description: string;
  };
}

export default function AccountClient() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/signin');
        return;
      }
      setUser(user);
      await fetchPurchases(user.id);
    } catch (err) {
      console.error('Auth check failed:', err);
      router.push('/signin');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          video_id,
          created_at,
          expires_at,
          video:collection_videos (
            title,
            thumbnail,
            description
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: Purchase[] = (data || []).map((item: any) => ({
        id: item.id,
        video_id: item.video_id,
        created_at: item.created_at,
        expires_at: item.expires_at,
        video: {
          title: item.video?.title || '',
          thumbnail: item.video?.thumbnail || '',
          description: item.video?.description || ''
        }
      }));
      
      setPurchases(transformedData);
    } catch (err) {
      console.error('Error fetching purchases:', err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 pt-28">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect due to useEffect
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <main className="container mx-auto px-4 py-8 pt-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Account</h1>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-purple-600">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.user_metadata?.full_name || user.email}
              </h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Admin Dashboard Button */}
          {user.email === 'contact.exclusivelex@gmail.com' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="pt-4"
            >
              <a href="/admin">
                <button className="w-full bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors font-semibold mb-4">
                  Admin Dashboard
                </button>
              </a>
            </motion.div>
          )}

          {/* Purchase History */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase History</h3>
            {purchases.length === 0 ? (
              <p className="text-gray-600">No purchases yet. Start exploring our collections!</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {purchases.map((purchase) => (
                  <motion.div
                    key={purchase.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-50 rounded-lg p-4 border"
                  >
                    <div className="aspect-video bg-gray-200 rounded mb-3 overflow-hidden">
                      {purchase.video?.thumbnail && (
                        <img
                          src={purchase.video.thumbnail}
                          alt={purchase.video.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {purchase.video?.title || 'Video'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {purchase.video?.description || 'No description available'}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">
                        Purchased: {new Date(purchase.created_at).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        isExpired(purchase.expires_at)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {isExpired(purchase.expires_at) ? 'Expired' : 'Active'}
                      </span>
                    </div>
                    {!isExpired(purchase.expires_at) && (
                      <a
                        href={`/watch/${purchase.video_id}`}
                        className="block w-full mt-3 bg-purple-600 text-white text-center py-2 rounded hover:bg-purple-700 transition-colors text-sm"
                      >
                        Watch Now
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
            <div className="space-y-4">
              <button
                onClick={handleSignOut}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
} 