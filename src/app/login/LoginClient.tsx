"use client";
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showError, setShowError] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const authError = searchParams?.get('authError');
    if (authError === 'true') {
      setShowError(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !isRedirecting) {
      setIsRedirecting(true);
      console.log('User authenticated, redirecting...', session.user);
      
      // Clear any auth error params from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('authError');
      window.history.replaceState({}, '', newUrl.toString());
      
      // Redirect based on user role
      if ((session.user as any).role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    }
  }, [status, session, router, isRedirecting]);

  const handleSignIn = async () => {
    setShowError(false);
    try {
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/'
      });
      
      if (result?.error) {
        console.error('Sign in error:', result.error);
        setShowError(true);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      setShowError(true);
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
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800 mx-auto mb-4"></div>
          <p className="text-stone-600">Redirecting...</p>
        </div>
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
        
        {showError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="text-sm text-red-700">
              <p className="font-medium">Authentication Error</p>
              <p>There was a problem signing you in. Please try again.</p>
            </div>
          </div>
        )}
        
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <button
            className="w-full flex items-center justify-center border border-stone-300 rounded-md py-3 px-4 font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
            onClick={handleSignIn}
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
} 