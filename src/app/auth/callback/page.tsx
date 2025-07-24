"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback: Starting session check...');
        
        // Wait a bit for the session to be properly established
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data, error } = await supabase.auth.getSession();
        
        console.log('Auth callback: Session check result:', { 
          hasSession: !!data.session, 
          error: error?.message,
          userId: data.session?.user?.id 
        });
        
        if (error) {
          console.error('Auth callback error:', error);
          setError('Authentication failed. Please try again.');
          router.push('/login?error=callback_error');
          return;
        }

        if (data.session && data.session.user) {
          console.log('Auth callback: Successful auth, redirecting to home');
          // Successful auth, redirect to home
          router.push('/');
        } else {
          console.log('Auth callback: No session found, redirecting to login');
          // No session, redirect to login
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth callback exception:', err);
        setError('Authentication failed. Please try again.');
        router.push('/login?error=callback_error');
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">❌</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-stone-800 text-white px-4 py-2 rounded hover:bg-stone-900"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800 mx-auto mb-4"></div>
        <p className="text-stone-600">
          {isLoading ? 'Completing sign in...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
} 