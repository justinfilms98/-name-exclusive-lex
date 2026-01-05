"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function EntrySuccessPage() {
  const [status, setStatus] = useState<'checking' | 'success' | 'pending' | 'error'>('checking');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    verifyAccess();
  }, []);

  const verifyAccess = async () => {
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Check entry access status
      const { data: access, error } = await supabase
        .from('entry_access')
        .select('status, stripe_session_id')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking entry access:', error);
        setStatus('error');
        return;
      }

      if (access) {
        if (access.status === 'active') {
          setStatus('success');
          // Redirect to home with welcome param after a short delay
          setTimeout(() => {
            router.push('/?welcome=1');
          }, 2000);
        } else if (access.status === 'pending') {
          setStatus('pending');
          // If we have a session_id, wait a bit and check again (webhook might be processing)
          if (sessionId) {
            setTimeout(() => {
              verifyAccess();
            }, 3000);
          }
        } else {
          setStatus('error');
        }
      } else {
        // No entry access record found
        setStatus('error');
      }
    } catch (error) {
      console.error('Error verifying access:', error);
      setStatus('error');
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-brand-mist flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="card-glass p-8">
            <Loader2 className="w-12 h-12 text-brand-sage mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-serif text-brand-pine mb-2">Verifying Payment</h1>
            <p className="text-brand-earth">Please wait while we confirm your entry fee payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-brand-mist flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="card-glass p-8 text-center">
            <Loader2 className="w-12 h-12 text-brand-sage mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-serif text-brand-pine mb-2">Processing Payment</h1>
            <p className="text-brand-earth mb-6">
              Your payment is being processed. This may take a few moments...
            </p>
            <button
              onClick={verifyAccess}
              className="btn-secondary"
            >
              Check Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-brand-mist flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="card-glass p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-serif text-brand-pine mb-2">Payment Verification Failed</h1>
            <p className="text-brand-earth mb-6">
              We couldn't verify your payment. Please contact support if you've been charged.
            </p>
            <div className="space-y-3">
              <Link href="/entry" className="btn-primary block">
                Try Again
              </Link>
              <Link href="/" className="btn-secondary block">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-mist flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card-glass p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-serif text-brand-pine mb-4">Welcome!</h1>
          <p className="text-lg text-brand-earth mb-6">
            Your entry fee has been processed successfully. You now have access to browse Exclusive Lex.
          </p>
          <p className="text-sm text-brand-sage mb-6">
            Redirecting you to the home page...
          </p>
          <Link href="/?welcome=1" className="btn-primary">
            Continue to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
