"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    if (status === 'authenticated' && session) {
      const redirectTo = searchParams?.get('redirectTo') || '/account';
      router.push(redirectTo);
    }
  }, [session, status, router, searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await signIn('google', {
        callbackUrl: searchParams?.get('redirectTo') || '/account',
        redirect: false,
      });
      
      if (result?.error) {
        console.error('Google OAuth error:', result.error);
        if (result.error.includes('DNS') || result.error.includes('network')) {
          setError('Network connection issue. Please check your internet connection and try again.');
        } else {
          setError(result.error || 'Google sign-in failed. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Google sign-in exception:', err);
      setError('Unable to connect to Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Will redirect due to useEffect
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-serif text-stone-800 mb-2">Welcome Back</h2>
          <p className="text-stone-600">Sign in to access your exclusive content</p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
            >
              <p className="text-red-600 text-sm">{error}</p>
            </motion.div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-stone-300 rounded-md shadow-sm bg-white text-stone-700 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-stone-600"></div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-stone-500">
              By signing in, you agree to our{' '}
              <a href="#" className="text-stone-600 hover:text-stone-800 underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-stone-600 hover:text-stone-800 underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 