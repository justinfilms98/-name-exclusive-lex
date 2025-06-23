"use client";
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AccountClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="container mx-auto px-4 py-8 pt-24 text-stone-800">
        <h1 className="text-4xl font-serif mb-6">My Account</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Welcome, {session.user?.name || 'User'}!</h2>
            <p className="text-stone-600">You are logged in with: {session.user?.email}</p>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold">User Role:</h3>
            <p className="text-stone-600 capitalize">{session.user?.role || 'user'}</p>
          </div>
          <pre className="bg-stone-100 p-4 rounded-md overflow-x-auto text-sm">
            <code>{JSON.stringify(session, null, 2)}</code>
          </pre>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
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