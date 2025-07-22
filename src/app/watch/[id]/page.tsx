"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, AlertCircle, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface Purchase {
  id: string;
  user_id: string;
  collection_id: string;
  created_at: string;
  expires_at: string;
}

export default function WatchPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const collectionId = params.id;
  
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (!collectionId) {
      setError('No collection ID provided');
      setLoading(false);
      return;
    }

    // For now, we'll need to get the session ID from somewhere
    // This is a simplified version - in practice you'd need to get the session ID
    // from the URL params or from the user's active purchase
    loadPurchase();
  }, [collectionId]);

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
      // This is a simplified version - you'd need to get the session ID
      // from the URL or from the user's active purchase for this collection
      setError('Session ID required for purchase verification');
      setLoading(false);
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