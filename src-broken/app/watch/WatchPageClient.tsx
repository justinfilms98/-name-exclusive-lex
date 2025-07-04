"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function WatchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const videoId = searchParams?.get("videoId");
    const token = searchParams?.get("token");
    if (!videoId || !token) {
      setError("Missing videoId or token");
      setLoading(false);
      return;
    }
    fetch(`/api/videos/stream?videoId=${videoId}&token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || "Access denied");
        } else {
          setStreamUrl(data.streamUrl);
          setExpiresAt(data.expiresAt);
        }
      })
      .catch((err) => setError(err.message || "Failed to load video"))
      .finally(() => setLoading(false));
  }, [searchParams]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft(0);
        router.push("/collections");
      } else {
        setTimeLeft(Math.ceil(ms / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4C7B4]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#654C37] mb-4"></div>
          <p className="text-[#654C37]">Loading your video...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !streamUrl) {
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
          <h2 className="text-2xl font-bold text-[#654C37] mb-2">Access Denied</h2>
          <p className="text-[#654C37]/80 mb-4">{error}</p>
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#D4C7B4] px-4 py-8">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-6">
        <video
          ref={videoRef}
          src={streamUrl}
          controls
          autoPlay
          className="w-full rounded-lg"
        />
        <div className="mt-4 flex justify-between items-center">
          <span className="text-[#654C37] font-semibold">
            Time left: {timeLeft > 0 ? `${timeLeft}s` : "Expired"}
          </span>
          <button
            className="bg-[#654C37] text-white px-4 py-2 rounded hover:bg-[#654C37]/90"
            onClick={() => router.push("/collections")}
          >
            Back to Collections
          </button>
        </div>
      </div>
    </div>
  );
} 