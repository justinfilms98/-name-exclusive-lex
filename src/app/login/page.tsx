"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, signInWithGoogle } from '@/lib/supabase';
import { LogIn, Shield, Heart, Star } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const getSession = async () => {
      try {
        console.log('Login page: Checking session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('Login page: Session check result:', { 
          hasSession: !!session, 
          userId: session?.user?.id,
          email: session?.user?.email 
        });
        
        if (session?.user) {
          setUser(session.user);
          console.log('Login page: User found, redirecting to home');
          router.push('/');
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError('Failed to check user session');
      } finally {
        setSessionChecked(true);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Login page: Auth state changed:', event, session?.user?.email);
        if (session?.user) {
          setUser(session.user);
          console.log('Login page: Auth state change - redirecting to home');
          router.push('/');
        }
        setError(null);
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Login page: Starting Google sign in...');
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Sign in error:', error);
        setError('Failed to sign in. Please try again.');
      } else {
        console.log('Login page: Google sign in initiated successfully');
      }
    } catch (error) {
      console.error('Sign in exception:', error);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Don't render until session is checked
  if (!sessionChecked) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-almond pt-10 sm:pt-12 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Checking session...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-almond pt-10 sm:pt-12 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-almond pt-10 sm:pt-12">
      <div className="max-w-md mx-auto px-4 py-8">
        
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <h1 className="heading-1 mb-4">Exclusive Lex</h1>
          <p className="body-large text-sage">
            Sign in to access premium exclusive content
          </p>
        </div>

        {/* Login Card */}
        <div className="card-glass p-8 text-center">
          <div className="mb-6">
            <Shield className="w-16 h-16 text-sage mx-auto mb-4" />
            <h2 className="heading-3 mb-2">Secure Access</h2>
            <p className="text-sage text-sm">
              Sign in with your Google account to access exclusive collections
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 spinner"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign Up or Login with Google</span>
              </>
            )}
          </button>

          <p className="text-sage text-xs mt-4">
            By signing in, you agree to our terms of service and privacy policy
          </p>
        </div>

        {/* Features */}
        <div className="mt-12 space-y-4">
          <div className="flex items-center space-x-3 text-sage">
            <Heart className="w-5 h-5 text-khaki" />
            <span className="text-sm">Exclusive behind-the-scenes content</span>
          </div>
          <div className="flex items-center space-x-3 text-sage">
            <Star className="w-5 h-5 text-khaki" />
            <span className="text-sm">High-quality videos and photos</span>
          </div>
          <div className="flex items-center space-x-3 text-sage">
            <Shield className="w-5 h-5 text-khaki" />
            <span className="text-sm">Secure, time-limited access</span>
          </div>
        </div>
      </div>
    </div>
  );
} 