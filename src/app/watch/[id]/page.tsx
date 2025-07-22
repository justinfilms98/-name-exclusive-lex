"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, AlertCircle, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { getSignedUrl } from '@/lib/supabase';

interface Purchase {
  id: string;
  user_id: string;
  collection_id: string;
  created_at: string;
  expires_at: string;
  collection: {
    id: string;
    title: string;
    description: string;
    video_path: string;
    thumbnail_path: string;
    duration: number;
  };
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const collectionId = resolvedParams.id;
  
  return <WatchPageClient collectionId={collectionId} />;
}

function WatchPageClient({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    loadPurchase();
  }, [sessionId]);

  useEffect(() => {
    if (timeRemaining <= 0 && purchase) {
      setError('Access has expired');
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          setError('Access has expired');
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, purchase]);

  const loadPurchase = async () => {
    try {
      const res = await fetch(`/api/get-purchase?session_id=${sessionId}`);
      const { purchase, error } = await res.json();
      
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      // Verify the purchase is for the correct collection
      if (purchase.collection_id !== collectionId) {
        setError('Purchase does not match this collection');
        setLoading(false);
        return;
      }

      setPurchase(purchase);

      // Calculate time remaining
      const expiresAt = new Date(purchase.expires_at);
      const now = new Date();
      const remaining = expiresAt.getTime() - now.getTime();
      setTimeRemaining(Math.max(0, remaining));

      // Get signed URL for video
      if (purchase.collection?.video_path) {
        const { data: signedUrl } = await getSignedUrl('media', purchase.collection.video_path);
        if (signedUrl) {
          setVideoUrl(signedUrl.signedUrl);
        }
      }

    } catch (err: any) {
      console.error('Error loading purchase:', err);
      setError(err.message || 'Failed to load purchase');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-stone-300 text-lg">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-100 mb-2">Access Denied</h1>
          <p className="text-stone-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/collections')}
            className="inline-flex items-center px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-semibold text-stone-100 mb-2">Purchase Not Found</h1>
          <p className="text-stone-300 mb-6">You need to purchase this collection to watch it.</p>
          <button
            onClick={() => router.push('/collections')}
            className="inline-flex items-center px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            Browse Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900">
      {/* Header */}
      <div className="bg-stone-800 border-b border-stone-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-semibold text-stone-100">Exclusive Content</h1>
            <p className="text-stone-300 text-sm">Limited time access</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-stone-300">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm">{formatTime(timeRemaining)}</span>
            </div>
            
            <button
              onClick={() => router.push('/collections')}
              className="text-stone-300 hover:text-white transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="relative bg-stone-800 rounded-lg overflow-hidden">
          {videoUrl ? (
            <video
              ref={(video) => {
                if (video) {
                  video.muted = isMuted;
                }
              }}
              className="w-full h-auto"
              controls={showControls}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onEnded={handleVideoEnded}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="aspect-video bg-stone-700 flex items-center justify-center">
              <div className="text-center">
                <Play className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                <p className="text-stone-300">Video loading...</p>
              </div>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="mt-6 bg-white rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-stone-800 mb-2">
            Collection Video
          </h2>
          <p className="text-stone-600 mb-4">Your exclusive content is now playing.</p>
          
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>Purchased: {new Date(purchase.created_at).toLocaleDateString()}</span>
            <span>Time remaining: {formatTime(timeRemaining)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 