"use client";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export default function AccountClient() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin');
      } else {
        setUser(user);
      }
      setLoading(false);
    }
    getUser();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 text-stone-800">
        <h1 className="text-4xl font-serif mb-6">My Account</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Welcome!</h2>
            <p className="text-stone-600">You are logged in with: {user.email}</p>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold">User ID:</h3>
            <p className="text-stone-600 text-xs">{user.id}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return null;
}