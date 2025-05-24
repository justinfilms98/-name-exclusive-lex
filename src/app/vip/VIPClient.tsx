"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
// import { toast } from '@/components/Toast'; // Placeholder for toast notifications

export default function VIPClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="container mx-auto px-4 py-8 pt-28">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-pine"></div>
        </div>
      </main>
    );
  }

  if (!session) {
    return null; // Will redirect due to useEffect
  }

  return (
    <main className="min-h-screen bg-brand-mist py-8 px-4 pt-28">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-serif text-brand-pine mb-8 text-center">Subscription Tiers</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Silver Tier */}
          <div className="bg-brand-almond rounded-lg shadow-md p-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-brand-pine mb-2">Silver</h2>
            <div className="text-3xl font-bold text-brand-sage mb-4">$60<span className="text-lg font-normal">/mo</span></div>
            <ul className="mb-6 space-y-2 text-brand-earth text-left w-full">
              <li>✓ Unlocks 3 new collections per month</li>
            </ul>
            <button
              className="bg-brand-tan text-white px-6 py-2 rounded font-semibold hover:bg-brand-earth transition-colors w-full"
              onClick={() => handleSubscribe('silver')}
            >
              Subscribe Now
            </button>
          </div>
          {/* Gold Tier */}
          <div className="bg-brand-almond rounded-lg shadow-md p-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-brand-pine mb-2">Gold</h2>
            <div className="text-3xl font-bold text-brand-tan mb-4">$100<span className="text-lg font-normal">/mo</span></div>
            <ul className="mb-6 space-y-2 text-brand-earth text-left w-full">
              <li>✓ Unlocks 5 new collections per month</li>
              <li>✓ WhatsApp chat</li>
            </ul>
            <button
              className="bg-brand-tan text-white px-6 py-2 rounded font-semibold hover:bg-brand-earth transition-colors w-full"
              onClick={() => handleSubscribe('gold')}
            >
              Subscribe Now
            </button>
          </div>
          {/* Platinum Tier */}
          <div className="bg-brand-almond rounded-lg shadow-md p-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-brand-pine mb-2">Platinum</h2>
            <div className="text-3xl font-bold text-brand-pine mb-4">$500<span className="text-lg font-normal">/mo</span></div>
            <ul className="mb-6 space-y-2 text-brand-earth text-left w-full">
              <li>✓ Unlocks 10 new collections per month</li>
              <li>✓ WhatsApp chat</li>
              <li>✓ Private request option</li>
            </ul>
            <button
              className="bg-brand-tan text-white px-6 py-2 rounded font-semibold hover:bg-brand-earth transition-colors w-full"
              onClick={() => handleSubscribe('platinum')}
            >
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
    </main>
  );

  function handleSubscribe(tier: 'silver' | 'gold' | 'platinum') {
    fetch('/api/checkout/vip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          // toast('Failed to start subscription: ' + (data.error || 'Unknown error'), { type: 'error' });
        }
      })
      .catch(err => {
        // toast('Failed to start subscription: ' + err.message, { type: 'error' });
      });
  }
} 