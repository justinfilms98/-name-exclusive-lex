"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import supabase, { getUser } from '@/lib/auth';

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

export default function SuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data } = await getUser();
      setUser(data?.user || null);
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
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
    if (user?.email) {
      fetchPurchaseDetails(sessionId);
    }
  }, [user, router, searchParams]);

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
    <div className="min-h-screen bg-[#D4C7B4] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Success Header */}
          <div className="bg-[#654C37] text-white p-8 text-center relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 bg-brand-almond rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-[#D4AF37]"
              style={{ boxShadow: '0 0 32px 8px #D4AF37, 0 0 0 0 #fff' }}
            >
              <motion.svg
                className="w-10 h-10 text-[#D4AF37]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                initial={{ filter: 'blur(2px)', opacity: 0.7 }}
                animate={{ filter: 'blur(0px)', opacity: 1 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </motion.svg>
            </motion.div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">You're In…</h1>
            <p className="text-lg text-white/90 mb-2">We love your taste. Your private access is ready.</p>
            <p className="text-white/70 italic">Let's make this our little secret.</p>
          </div>
          <div className="border-t border-[#654C37]/10 p-8 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-6 text-[#654C37] text-lg font-medium"
            >
              Your video is waiting in your account.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, type: 'spring', stiffness: 120 }}
            >
              <Link
                href="/account"
                className="inline-block bg-gradient-to-r from-[#D4AF37] via-[#B89178] to-[#654C37] text-white px-8 py-4 rounded-full font-bold text-xl shadow-xl border-2 border-[#D4AF37] shimmer-btn hover:scale-105 transition-all duration-300 mt-4"
                style={{ boxShadow: '0 2px 24px 0 #D4AF37' }}
              >
                Go to My Account & Watch Now
              </Link>
              <style jsx>{`
                .shimmer-btn {
                  position: relative;
                  overflow: hidden;
                }
                .shimmer-btn::before {
                  content: '';
                  position: absolute;
                  top: 0; left: -75%;
                  width: 50%; height: 100%;
                  background: linear-gradient(120deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.15) 100%);
                  animation: shimmer 2.5s infinite;
                }
                @keyframes shimmer {
                  0% { left: -75%; }
                  100% { left: 125%; }
                }
              `}</style>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 