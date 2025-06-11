"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@supabase/auth-helpers-react';

interface PurchaseDetails {
  id: string;
  videoId: number;
  videoTitle: string;
  collection: string;
  expiresAt: string;
}

interface VerifyResponse {
  success: boolean;
  session?: {
    id: string;
    payment_status: string;
    customer_email: string;
    amount_total: number;
    currency: string;
  };
  purchases?: PurchaseDetails[];
  videos?: {
    id: number;
    title: string;
    price: number;
  }[];
  error?: string;
}

export default function SuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useUser();

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    if (!sessionId) {
      setVerifyResult({ success: false, error: 'Missing session_id' });
      setLoading(false);
      return;
    }

    // Verify purchase with user email if available
    const verifyPurchase = async () => {
      try {
        const userEmail = user?.email;
        const url = userEmail 
          ? `/api/verify-purchase?session_id=${sessionId}&user_email=${encodeURIComponent(userEmail)}`
          : `/api/verify-purchase?session_id=${sessionId}`;

        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Verification failed');
        }
        
        setVerifyResult(data);
      } catch (error) {
        console.error('Purchase verification error:', error);
        setVerifyResult({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Verification failed' 
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPurchase();
  }, [searchParams, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4C7B4]">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#654C37] mx-auto mb-4"></div>
          <p className="text-[#654C37]">Verifying your purchase...</p>
        </div>
      </div>
    );
  }

  if (!verifyResult?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4C7B4] px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-bold text-[#654C37] mb-2">Purchase Verification Failed</h2>
          <p className="text-[#654C37]/80 mb-4">{verifyResult?.error || 'Unable to verify purchase'}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/collections')}
              className="bg-[#654C37] text-white px-6 py-2 rounded-lg hover:bg-[#654C37]/90 transition-colors"
            >
              Browse Collections
            </button>
            <button
              onClick={() => router.push('/account')}
              className="bg-[#D4C7B4] text-[#654C37] px-6 py-2 rounded-lg hover:bg-[#D4C7B4]/90 transition-colors"
            >
              My Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success case - show purchase details
  const { session, purchases, videos } = verifyResult;
  const totalAmount = session?.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00';
  const currency = session?.currency?.toUpperCase() || 'USD';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#D4C7B4] px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-xl shadow-lg text-center max-w-2xl w-full"
      >
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 tracking-tight text-[#654C37]">PURCHASE SUCCESSFUL!</h1>
          <p className="text-lg text-[#654C37]/80 mb-4">Thank you for your purchase. Your access is now active.</p>
        </div>

        {/* Purchase Summary */}
        <div className="bg-[#F5F1EB] p-6 rounded-lg mb-6 text-left">
          <h3 className="text-xl font-semibold text-[#654C37] mb-4">Purchase Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[#654C37]/80">Total Amount:</span>
              <span className="font-semibold text-[#654C37]">${totalAmount} {currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#654C37]/80">Items Purchased:</span>
              <span className="font-semibold text-[#654C37]">{purchases?.length || 0}</span>
            </div>
            {session?.customer_email && (
              <div className="flex justify-between">
                <span className="text-[#654C37]/80">Email:</span>
                <span className="font-semibold text-[#654C37]">{session.customer_email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Purchased Videos */}
        {purchases && purchases.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-[#654C37] mb-4">Your Videos</h3>
            <div className="space-y-3">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="bg-[#F5F1EB] p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-[#654C37]">{purchase.videoTitle}</h4>
                      <p className="text-sm text-[#654C37]/70">Collection: {purchase.collection}</p>
                      <p className="text-sm text-[#654C37]/70">
                        Expires: {new Date(purchase.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/collections/watch/${purchase.videoId}`}
                      className="bg-[#D4AF37] text-white px-4 py-2 rounded-lg hover:bg-[#B89178] transition-colors text-sm font-semibold"
                    >
                      WATCH
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {purchases && purchases.length > 0 && (
            <Link
              href={`/collections/watch/${purchases[0].videoId}`}
              className="bg-[#D4AF37] text-white px-8 py-3 rounded-full shadow-lg font-bold text-lg hover:bg-[#B89178] transition-colors"
            >
              WATCH NOW
            </Link>
          )}
          <Link
            href="/collections"
            className="bg-[#654C37] text-white px-8 py-3 rounded-lg hover:bg-[#654C37]/90 transition-colors font-semibold"
          >
            Browse More
          </Link>
          <Link
            href="/account"
            className="bg-[#D4C7B4] text-[#654C37] px-8 py-3 rounded-lg hover:bg-[#D4C7B4]/90 transition-colors font-semibold"
          >
            My Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
} 