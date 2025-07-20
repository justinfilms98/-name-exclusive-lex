"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, signInWithGoogle } from '@/lib/supabase';
import { LogIn, Shield, Heart, Star } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        router.push('/collections');
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          router.push('/collections');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Sign in error:', error);
        alert('Failed to sign in. Please try again.');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-almond pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Redirecting to collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-almond pt-20">
      <div className="max-w-md mx-auto px-4 py-16">
        
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
                <span>Sign in with Google</span>
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