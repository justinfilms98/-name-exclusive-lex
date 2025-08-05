"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Heart, DollarSign, CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';

export default function DonatePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    getSession();
  }, []);

  const handleAmountChange = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(0);
  };

  const getDonationAmount = () => {
    if (selectedAmount > 0) {
      return selectedAmount;
    }
    if (customAmount) {
      const amount = parseFloat(customAmount);
      return isNaN(amount) ? 0 : amount;
    }
    return 0;
  };

  const handleDonate = async () => {
    const amount = getDonationAmount();
    if (amount <= 0) {
      alert('Please select a donation amount');
      return;
    }

    if (!user) {
      window.location.href = '/login';
      return;
    }

    setCheckoutLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        alert('Authentication error. Please try logging in again.');
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/create-donation-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: amount,
          userId: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        alert('Donation failed: ' + data.error);
        return;
      }

      if (data.sessionId) {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        if (stripe) {
          try {
            const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
            if (error) {
              window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
            }
          } catch (redirectError) {
            window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
          }
        } else {
          window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
        }
      }
    } catch (error) {
      console.error('Donation error:', error);
      alert('Failed to start donation process. Please try again.');
    } finally {
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

  return (
    <div className="min-h-screen bg-brand-mist">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-brand-khaki/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-brand-khaki" />
          </div>
          <h1 className="text-4xl font-serif text-brand-pine mb-4">Thank You</h1>
          <p className="text-xl text-brand-earth max-w-2xl mx-auto">
            Your appreciation for my work means everything to me. Every contribution helps me continue creating the luxury experiences you value.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Donation Options */}
          <div className="card-glass p-8">
            <h2 className="text-2xl font-serif text-brand-pine mb-6">Express Your Appreciation</h2>
            
            {/* Preset Amounts */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[5, 10, 25, 50].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAmountChange(amount)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedAmount === amount
                      ? 'border-brand-khaki bg-brand-khaki text-white'
                      : 'border-brand-sage bg-white text-brand-pine hover:border-brand-khaki hover:bg-brand-almond'
                  }`}
                >
                  <div className="text-2xl font-bold">${amount}</div>
                  <div className="text-sm opacity-75">
                    {amount === 5 && 'A thoughtful gesture'}
                    {amount === 10 && 'Your appreciation'}
                    {amount === 25 && 'A generous gift'}
                    {amount === 50 && 'Your valued support'}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="mb-6">
              <label className="block text-brand-pine font-semibold mb-2">Custom Amount</label>
              <div className="flex items-center space-x-2">
                <span className="text-brand-sage text-lg">$</span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="flex-1 px-4 py-3 border border-brand-sage rounded-lg focus:outline-none focus:border-brand-khaki"
                  min="1"
                  step="0.01"
                />
              </div>
            </div>

            {/* Donation Display */}
            {getDonationAmount() > 0 && (
              <div className="mb-6 p-4 bg-brand-khaki/10 border border-brand-khaki/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-brand-pine font-semibold">Your Gift</span>
                  <span className="text-2xl font-bold text-brand-khaki">${getDonationAmount().toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Donate Button */}
            {user ? (
              <button
                onClick={handleDonate}
                disabled={checkoutLoading || getDonationAmount() <= 0}
                className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <>
                    <div className="w-4 h-4 spinner"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    <span>Donate with Stripe</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="text-center text-brand-sage text-sm">
                  Sign in to make a donation
                </div>
                <Link
                  href="/login"
                  className="w-full btn-secondary text-center block"
                >
                  Sign Up or Login with Google
                </Link>
              </div>
            )}

            {/* Payment Info */}
            <div className="mt-6 text-xs text-brand-sage text-center space-y-1">
              <p>Secure donation powered by Stripe</p>
              <p>Supports Apple Pay, Google Pay & all major cards</p>
              <p className="text-brand-khaki">SSL encrypted • 256-bit security</p>
            </div>
          </div>

          {/* Benefits & Info */}
                      <div className="card-glass p-6">
              <h3 className="text-xl font-serif text-brand-pine mb-4">Gratitude</h3>
              <p className="text-brand-earth mb-4">
                Your appreciation for my work is deeply meaningful to me. Every contribution, regardless of size, helps me continue creating the exceptional experiences you value.
              </p>
              <p className="text-brand-earth text-sm">
                Thank you for being part of my journey and for valuing the beauty and quality I strive to deliver.
              </p>
            </div>
        </div>

        {/* Back to Collections */}
        <div className="text-center mt-12">
          <Link
            href="/collections"
            className="inline-flex items-center space-x-2 text-brand-sage hover:text-brand-khaki transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Collections</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 