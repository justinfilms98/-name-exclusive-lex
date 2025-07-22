"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, getSignedUrl } from '@/lib/supabase';
import { Clock, AlertCircle, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Purchase {
  id: string;
  user_id: string;
  collection_video_id: string;
  stripe_session_id: string;
  created_at: string;
  expires_at: string;
  amount_paid: number;
  CollectionVideo: {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnail: string;
    price: number;
  };
}

function WatchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams?.get('session_id');
  const { addToast } = useToast();
  
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    loadPurchase();
    
    // Get current user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getSession();
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

  // Screenshot detection
  useEffect(() => {
    const report = async () => {
      const res = await fetch('/api/report-strike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      const json = await res.json()
      addToast(`Screenshot detected (${json.strike_count}/${json.threshold})`, 'error')
      if (json.expired) {
        setError('Access revoked due to repeated screenshot attempts')
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') report()
    }
    const onCtx = (e: MouseEvent) => {
      e.preventDefault()
      report()
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('contextmenu', onCtx)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('contextmenu', onCtx)
    }
  }, [sessionId, addToast])

  const loadPurchase = async () => {
    try {
      const res = await fetch(`/api/get-purchase?session_id=${sessionId}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Unknown error')
        return
      }
      setPurchase(json.purchase)

      // Calculate time remaining
      const expiresAt = new Date(json.purchase.expires_at);
      const now = new Date();
      const remaining = expiresAt.getTime() - now.getTime();
      setTimeRemaining(Math.max(0, remaining));

      // Get signed URL for video
      if (json.purchase.CollectionVideo?.videoUrl) {
        setVideoUrl(json.purchase.CollectionVideo.videoUrl);
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
    const video = document.getElementById('video-player') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    const video = document.getElementById('video-player') as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading your content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-stone-800 mb-2">Access Error</h1>
          <p className="text-stone-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/collections')}
            className="bg-stone-800 text-white px-6 py-2 rounded hover:bg-stone-900 transition-colors"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-stone-800 mb-2">Purchase Not Found</h1>
          <p className="text-stone-600 mb-6">The requested purchase could not be found.</p>
          <button
            onClick={() => router.push('/collections')}
            className="bg-stone-800 text-white px-6 py-2 rounded hover:bg-stone-900 transition-colors"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900">
      {/* Header */}
      <div className="bg-stone-800 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{purchase.CollectionVideo.title}</h1>
            <p className="text-stone-300 text-sm">{purchase.CollectionVideo.description}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-stone-700 px-3 py-1 rounded">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatTime(timeRemaining)}</span>
            </div>
            
            <button
              onClick={() => router.push('/collections')}
              className="text-stone-300 hover:text-white transition-colors"
            >
              Back to Collections
            </button>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {videoUrl ? (
            <>
              <video
                id="video-player"
                src={videoUrl}
                className="w-full h-full"
                onEnded={handleVideoEnded}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onMouseMove={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              />
              {/* Dynamic Watermark */}
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%,-50%) rotate(-30deg)',
                pointerEvents: 'none', 
                opacity: 0.1, 
                fontSize: '5vw', 
                color: '#fff',
                zIndex: 10
              }}>
                {user?.email} — {new Date().toLocaleString()}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}

          {/* Video Controls Overlay */}
          {showControls && videoUrl && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  className="text-white hover:text-stone-300 transition-colors"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </button>
                
                <button
                  onClick={handleMuteToggle}
                  className="text-white hover:text-stone-300 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="mt-6 bg-white rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-stone-800 mb-2">
            {purchase.CollectionVideo.title}
          </h2>
          <p className="text-stone-600 mb-4">{purchase.CollectionVideo.description}</p>
          
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>Purchased: {new Date(purchase.created_at).toLocaleDateString()}</span>
            <span>Duration: {Math.floor(purchase.CollectionVideo.price / 60)} minutes</span>
          </div>
        </div>

        {/* Time Remaining Warning */}
        {timeRemaining < 60000 && timeRemaining > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800">
                Access expires in {formatTime(timeRemaining)}. Please finish watching soon.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    }>
      <WatchPageContent />
    </Suspense>
  );
} 