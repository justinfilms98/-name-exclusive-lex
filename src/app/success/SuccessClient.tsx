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
  const [verifyResult, setVerifyResult] = useState<{ success: boolean, videoId?: string, token?: string, error?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const { data } = await getUser();
      setUser(data?.user || null);
      setCheckingUser(false);
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (checkingUser) return;
    if (!user) return;
    const sessionId = searchParams?.get('session_id');
    if (!sessionId) {
      setVerifyResult({ success: false, error: 'Missing session_id' });
      setLoading(false);
      return;
    }
    fetch(`/api/verify-purchase?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => setVerifyResult(data))
      .catch(err => setVerifyResult({ success: false, error: err.message }))
      .finally(() => setLoading(false));
  }, [searchParams, user, checkingUser]);

  if (checkingUser || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#D4C7B4]">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4C7B4] px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-bold text-[#654C37] mb-2">Sign In Required</h2>
          <p className="text-[#654C37]/80 mb-4">Please sign in to access your purchase.</p>
          <button
            onClick={() => router.push('/signin')}
            className="bg-[#654C37] text-white px-6 py-2 rounded-lg hover:bg-[#654C37]/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!verifyResult?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4C7B4] px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-bold text-[#654C37] mb-2">Purchase Verification Failed</h2>
          <p className="text-[#654C37]/80 mb-4">{verifyResult?.error || 'Unable to load purchase details'}</p>
          <button
            onClick={() => router.push('/collections')}
            className="bg-[#654C37] text-white px-6 py-2 rounded-lg hover:bg-[#654C37]/90 transition-colors"
          >
            Browse Collections
          </button>
        </div>
      </div>
    );
  }

  if (verifyResult.success && verifyResult.videoId && verifyResult.token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#D4C7B4] px-4 py-8">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-3xl font-bold mb-2 tracking-tight">YOU'RE IN…</h1>
          <p className="text-lg text-[#654C37] mb-4">We love your taste. Your private access is ready.</p>
          <a
            href={`/collections/watch/${verifyResult.videoId}?token=${verifyResult.token}`}
            className="mt-6 px-6 py-3 bg-[#D4AF37] text-white rounded-full shadow-lg font-bold text-lg hover:bg-[#B89178] transition-colors"
          >
            WATCH NOW
          </a>
        </div>
      </div>
    );
  }

  // Only show this if success is true but videoId or token is missing
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#D4C7B4] px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        <h2 className="text-2xl font-bold text-[#654C37] mb-2">Missing Access Info</h2>
        <p className="text-[#654C37]/80 mb-4">Purchase details are incomplete. Please contact support.</p>
        <button
          onClick={() => router.push('/collections')}
          className="bg-[#654C37] text-white px-6 py-2 rounded-lg hover:bg-[#654C37]/90 transition-colors"
        >
          Browse Collections
        </button>
      </div>
    </div>
  );
} 