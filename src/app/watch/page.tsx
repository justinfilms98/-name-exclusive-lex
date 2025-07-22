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
  const [isBlurred, setIsBlurred] = useState(false);

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
      // Temporarily blur content
      setIsBlurred(true)
      setTimeout(() => setIsBlurred(false), 3000) // Unblur after 3 seconds
      
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

    // Enhanced screenshot detection
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') || // DevTools
          (e.ctrlKey && e.shiftKey && e.key === 'C') || // DevTools
          (e.ctrlKey && e.shiftKey && e.key === 'J') || // DevTools
          (e.key === 'F12') || // F12
          (e.ctrlKey && e.key === 'U')) { // View source
        e.preventDefault()
        report()
      }
    }
    
    const onCtx = (e: MouseEvent) => {
      e.preventDefault()
      report()
    }

    // Detect when page loses focus (alt+tab, switching apps)
    const onVisibilityChange = () => {
      if (document.hidden) {
        report()
      }
    }

    // Detect when window loses focus
    const onBlur = () => {
      report()
    }

    // Anti-capture techniques
    const addNoiseToDOM = () => {
      const videoContainer = document.querySelector('.screenshot-protected')
      if (videoContainer) {
        // Add invisible elements that change frequently
        const noise = document.createElement('div')
        noise.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 1px;
          height: 1px;
          background: transparent;
          z-index: 9999;
          pointer-events: none;
        `
        noise.textContent = Math.random().toString(36)
        videoContainer.appendChild(noise)
        
        // Remove after a short delay
        setTimeout(() => {
          if (noise.parentNode) {
            noise.parentNode.removeChild(noise)
          }
        }, 100)
      }
    }

    // Continuous monitoring for suspicious activity
    let lastReportTime = 0
    const monitorActivity = () => {
      const now = Date.now()
      if (now - lastReportTime > 5000) { // Prevent spam, 5 second cooldown
        // Check if dev tools are open (basic detection)
        const devtools = {
          open: false,
          orientation: null
        }
        
        const threshold = 160
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          devtools.open = true
          report()
          lastReportTime = now
        }
        
        // Add noise to DOM every few seconds
        addNoiseToDOM()
      }
    }

    // Monitor every 2 seconds
    const monitorInterval = setInterval(monitorActivity, 2000)

    // Detect clipboard changes (screenshots often go to clipboard)
    const onClipboardChange = () => {
      report()
    }

    // Monitor clipboard for changes
    if (navigator.clipboard) {
      navigator.clipboard.readText().catch(() => {
        // Ignore permission errors, but still monitor
      })
    }

    // Add canvas overlay to make screenshots harder
    const addCanvasOverlay = () => {
      const videoContainer = document.querySelector('.screenshot-protected')
      if (videoContainer) {
        const canvas = document.createElement('canvas')
        canvas.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
          opacity: 0.01;
        `
        videoContainer.appendChild(canvas)
        
        // Draw random patterns
        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = videoContainer.clientWidth
          canvas.height = videoContainer.clientHeight
          
          // Draw random dots
          for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`
            ctx.fillRect(
              Math.random() * canvas.width,
              Math.random() * canvas.height,
              1,
              1
            )
          }
        }
      }
    }

    // Add canvas overlay
    addCanvasOverlay()

    // Detect screen capture attempts
    const detectScreenCapture = () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia({ video: true })
          .then(() => {
            report()
          })
          .catch(() => {
            // User denied or cancelled
          })
      }
    }

    // Monitor for screen capture API usage
    const originalGetDisplayMedia = navigator.mediaDevices?.getDisplayMedia
    if (navigator.mediaDevices && originalGetDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia = function(...args) {
        report()
        return originalGetDisplayMedia.apply(this, args)
      }
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('contextmenu', onCtx)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    document.addEventListener('copy', onClipboardChange)
    
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('contextmenu', onCtx)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('copy', onClipboardChange)
      clearInterval(monitorInterval)
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
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden screenshot-protected">
          {videoUrl ? (
            <>
              <video
                id="video-player"
                src={videoUrl}
                className={`w-full h-full ${isBlurred ? 'blur-md' : ''}`}
                onEnded={handleVideoEnded}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onMouseMove={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
                style={{
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  userSelect: 'none',
                  WebkitTouchCallout: 'none',
                  pointerEvents: 'auto'
                } as React.CSSProperties}
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
              
              {/* Screenshot Warning Overlay */}
              {isBlurred && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
                  <div className="text-center text-white p-6">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold mb-2">Screenshot Detected</h2>
                    <p className="text-lg">Content has been temporarily blurred for security.</p>
                    <p className="text-sm mt-2">Repeated attempts will result in access revocation.</p>
                  </div>
                </div>
              )}
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