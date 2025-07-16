"use client";
import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginClient() {
  const sessionHook = typeof useSession === 'function' ? useSession() : undefined;
  const session = sessionHook?.data;
  const status = sessionHook?.status;
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if ((session.user as any).role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/account');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-serif text-stone-800 mb-2">Welcome Back</h2>
          <p className="text-stone-600">Sign in to access your exclusive content</p>
        </div>
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <button
            className="w-full flex items-center justify-center border border-stone-300 rounded-md py-3 px-4 font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
            onClick={() => signIn('google')}
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
} 