"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  price: number;
}

interface WatchPageClientProps {
  videoId: string;
}

export default function WatchPageClient({ videoId }: WatchPageClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push(`/login?redirectTo=/watch/${videoId}`);
      return;
    }

    // Fetch video details and check access
    const checkAccess = async () => {
      try {
        setCheckingAccess(true);
        const response = await fetch(`/api/verify-purchase?videoId=${videoId}`);
        
        if (response.ok) {
          const data = await response.json();
          setVideo(data.video);
          setHasAccess(data.hasAccess);
        } else {
          setError('Failed to verify access');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [videoId, status, router]);

  if (status === 'loading' || checkingAccess) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-stone-300">{error}</p>
          <button
            onClick={() => router.push('/collections')}
            className="mt-4 bg-white text-stone-900 px-6 py-2 rounded-md hover:bg-stone-100 transition-colors"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white max-w-md mx-auto px-4"
        >
          <h1 className="text-3xl font-bold mb-4">Access Required</h1>
          <p className="text-stone-300 mb-6">
            You need to purchase this video to watch it.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/collections`)}
              className="w-full bg-white text-stone-900 px-6 py-3 rounded-md font-medium hover:bg-stone-100 transition-colors"
            >
              Browse Collections
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white hover:text-stone-900 transition-colors"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
          <button
            onClick={() => router.push('/collections')}
            className="bg-white text-stone-900 px-6 py-2 rounded-md hover:bg-stone-100 transition-colors"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              controls
              className="w-full h-full"
              poster={video.thumbnail}
              src={video.videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Video Info */}
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
            <p className="text-stone-300 mb-4">{video.description}</p>
            <div className="flex items-center space-x-4 text-sm text-stone-400">
              <span>Price: ${video.price}</span>
            </div>
          </div>

          {/* Back Button */}
          <div className="pt-4">
            <button
              onClick={() => router.push('/collections')}
              className="bg-stone-800 text-white px-6 py-2 rounded-md hover:bg-stone-700 transition-colors"
            >
              ← Back to Collections
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 