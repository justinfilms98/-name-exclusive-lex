"use client";

import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AccountClient() {
  const user = useUser();
  const router = useRouter();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-900"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 pt-28">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-green-900 mb-6">My Account</h1>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            {user?.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-20 h-20 rounded-full"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.user_metadata?.user_name || "User"}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
          {/* Admin Dashboard Button for Creator */}
          {user?.email === 'contact.exclusivelex@gmail.com' && (
            <div className="pt-4">
              <a href="/admin">
                <button className="bg-green-900 text-white px-4 py-2 rounded hover:bg-green-800 transition-colors">
                  Admin Dashboard
                </button>
              </a>
            </div>
          )}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
            <div className="space-y-4">
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                }}
                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase History</h3>
            <p className="text-gray-600">Your purchase history will appear here.</p>
          </div>
        </div>
      </div>
    </main>
  );
} 