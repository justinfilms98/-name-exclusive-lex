"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface PurchaseDetails {
  videoId: number;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  purchasedAt: string;
  expiresAt: string;
  price: number;
}

export default function SuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
      return;
    }

    if (!searchParams) {
      setError('Invalid session');
      setLoading(false);
      return;
    }

    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setError('Invalid session');
      setLoading(false);
      return;
    }

    if (status === 'authenticated' && session?.user?.email) {
      fetchPurchaseDetails(sessionId);
    }
  }, [status, session, router, searchParams]);

  const fetchPurchaseDetails = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/verify-purchase?session_id=${sessionId}`);
      if (!res.ok) throw new Error('Failed to verify purchase');
      const data = await res.json();
      setPurchaseDetails(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4C7B4]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#654C37] mb-4"></div>
          <p className="text-[#654C37]">Verifying your purchase...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !purchaseDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4C7B4] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#654C37] mb-2">Purchase Verification Failed</h2>
          <p className="text-[#654C37]/80 mb-4">{error || 'Unable to load purchase details'}</p>
          <button
            onClick={() => router.push('/collections')}
            className="bg-[#654C37] text-white px-6 py-2 rounded-lg hover:bg-[#654C37]/90 transition-colors"
          >
            Browse Collections
          </button>
        </motion.div>
      </div>
    );
  }

  const expiresDate = new Date(purchaseDetails.expiresAt);
  const duration = Math.ceil((expiresDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-[#D4C7B4] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            {/* Success Header */}
            <div className="bg-[#654C37] text-white p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">Thank You for Your Purchase!</h1>
              <p className="text-white/80">Your video is now ready to watch</p>
            </div>

            {/* Purchase Details */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={purchaseDetails.thumbnail}
                    alt={purchaseDetails.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#654C37] mb-4">{purchaseDetails.title}</h2>
                  <p className="text-[#654C37]/80 mb-6">{purchaseDetails.description}</p>
                  
                  <div className="space-y-4">
                    <div className="bg-[#D4C7B4]/30 p-4 rounded-lg">
                      <p className="text-[#654C37] font-medium mb-1">Access Duration</p>
                      <p className="text-[#654C37]/80">{duration} days</p>
                    </div>
                    
                    <div className="bg-[#D4C7B4]/30 p-4 rounded-lg">
                      <p className="text-[#654C37] font-medium mb-1">Expires On</p>
                      <p className="text-[#654C37]/80">{expiresDate.toLocaleDateString()}</p>
                    </div>
                    
                    <div className="bg-[#D4C7B4]/30 p-4 rounded-lg">
                      <p className="text-[#654C37] font-medium mb-1">Video Duration</p>
                      <p className="text-[#654C37]/80">{purchaseDetails.duration} minutes</p>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8"
                  >
                    <Link
                      href={`/watch/${purchaseDetails.videoId}`}
                      className="block w-full bg-[#654C37] text-white text-center py-4 rounded-lg font-semibold hover:bg-[#654C37]/90 transition-colors"
                    >
                      Watch Now
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Additional Actions */}
            <div className="border-t border-[#654C37]/10 p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/collections"
                  className="text-center py-3 px-6 rounded-lg border-2 border-[#654C37] text-[#654C37] hover:bg-[#654C37] hover:text-white transition-colors"
                >
                  Browse More Videos
                </Link>
                <Link
                  href="/account"
                  className="text-center py-3 px-6 rounded-lg border-2 border-[#654C37] text-[#654C37] hover:bg-[#654C37] hover:text-white transition-colors"
                >
                  View My Purchases
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Suspense>
  );
} 