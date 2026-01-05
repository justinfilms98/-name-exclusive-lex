"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EntryPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Redirect to login if not authenticated
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Check if user has active entry access (admin users bypass)
      const { isAdminEmail } = await import('@/lib/auth');
      const isAdmin = isAdminEmail(session.user.email);
      
      if (isAdmin) {
        setHasAccess(true);
        // Redirect to home if admin
        router.push('/?welcome=1');
        return;
      }

      const { data: access, error } = await supabase
        .from('entry_access')
        .select('status')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking entry access:', error);
      }

      if (access && access.status === 'active') {
        setHasAccess(true);
        // Redirect to home if already has access
        router.push('/?welcome=1');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking access:', error);
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setCheckoutLoading(true);

    try {
      // Get the user's session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        alert('Authentication error. Please try logging in again.');
        router.push('/login');
        return;
      }

      // Create entry fee checkout session
      const response = await fetch('/api/entry/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Checkout error:', data.error);
        alert('Checkout failed: ' + data.error);
        setCheckoutLoading(false);
        return;
      }

      if (data.sessionId) {
        // Redirect to Stripe checkout
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        if (stripe) {
          try {
            const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
            if (error) {
              console.error('Stripe checkout error:', error);
              window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
            }
          } catch (redirectError) {
            console.error('Redirect error:', redirectError);
            window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
          }
        } else {
          window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout process. Please try again.');
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-mist flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-brand-earth">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-brand-mist flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="card-glass p-8 sm:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-sage/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-brand-sage" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif tracking-wide text-brand-pine mb-4">
              Private Entry
            </h1>
            <p className="text-lg text-brand-earth leading-relaxed">
              Exclusive Lex is a private site. A one-time $20 entry fee is required to enter.
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-1">Important Notice</h3>
                <p className="text-sm text-yellow-700 leading-relaxed">
                  This entry fee is for access to the site only and does not unlock or include any collections.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="space-y-4">
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed py-4 text-lg"
            >
              {checkoutLoading ? (
                <>
                  <div className="w-5 h-5 spinner"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Pay $20 Entry Fee</span>
                </>
              )}
            </button>

            {/* Payment Info */}
            <div className="text-center text-sm text-brand-sage space-y-1 pt-4">
              <p>Secure checkout powered by Stripe</p>
              <p>Supports Apple Pay, Google Pay & all major cards</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-brand-sage/20 text-center">
            <p className="text-xs text-brand-earth">
              Already paid? <Link href="/entry/success" className="text-brand-sage hover:text-brand-khaki underline">Check status</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
