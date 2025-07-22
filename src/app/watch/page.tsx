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
      // Immediately expire access when screen capture detected
      const res = await fetch('/api/report-strike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: sessionId,
          event_type: 'screen_capture_detected'
        }),
      })
      const json = await res.json()
      
      if (json.expired) {
        setError('Access revoked due to screen capture detection')
        // Redirect to access denied page
        setTimeout(() => {
          router.push('/unauthorized?reason=screen_capture')
        }, 2000)
      } else {
        addToast(`Screen capture detected (${json.strike_count}/${json.threshold})`, 'error')
      }
    }

    // Enhanced screen capture detection
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

    // Detect screen capture API usage
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

    // Detect when other software is trying to capture
    const detectExternalCapture = () => {
      // Check if dev tools are open
      const devtools = {
        open: false,
        orientation: null
      }
      
      const threshold = 160
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        devtools.open = true
        report()
      }

      // Check for screen recording software
      if (navigator.userAgent.includes('OBS') || 
          navigator.userAgent.includes('Streamlabs') ||
          navigator.userAgent.includes('XSplit') ||
          navigator.userAgent.includes('Bandicam') ||
          navigator.userAgent.includes('Fraps')) {
        report()
      }
    }

    // Continuous monitoring for external capture attempts
    let lastReportTime = 0
    const monitorActivity = () => {
      const now = Date.now()
      if (now - lastReportTime > 2000) { // Prevent spam, 2 second cooldown
        detectExternalCapture()
        lastReportTime = now
      }
    }

    // Monitor every 1 second
    const monitorInterval = setInterval(monitorActivity, 1000)

    // Detect when user switches to other applications
    const onFocusChange = () => {
      if (!document.hasFocus()) {
        report()
      }
    }

    // Detect when user tries to use screen sharing
    const onScreenShare = () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia()
          .then(() => {
            report()
          })
          .catch(() => {
            // User denied
          })
      }
    }

    // Override screen sharing APIs
    if (navigator.mediaDevices) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia
      navigator.mediaDevices.getDisplayMedia = function(...args) {
        report()
        return originalGetDisplayMedia.apply(this, args)
      }
    }

    // Detect when user tries to use screen recording
    const detectScreenRecording = () => {
      // Check for common screen recording indicators
      if (window.screen && (window.screen as any).captureStream) {
        try {
          const stream = (window.screen as any).captureStream()
          if (stream) {
            report()
          }
        } catch (e) {
          // Ignore errors
        }
      }
    }

    // Monitor for screen recording attempts
    const screenRecordingInterval = setInterval(detectScreenRecording, 2000)

    document.addEventListener('keydown', onKey)
    document.addEventListener('contextmenu', onCtx)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocusChange)
    document.addEventListener('copy', onClipboardChange)
    
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('contextmenu', onCtx)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocusChange)
      document.removeEventListener('copy', onClipboardChange)
      clearInterval(monitorInterval)
      clearInterval(screenRecordingInterval)
    }
  }, [sessionId, addToast, router])

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

      // Get protected video URL
      if (json.purchase.CollectionVideo?.id) {
        const videoRes = await fetch(`/api/protected-video?session_id=${sessionId}&video_id=${json.purchase.CollectionVideo.id}`)
        const videoJson = await videoRes.json()
        if (videoRes.ok) {
          setVideoUrl(videoJson.videoUrl);
        } else {
          setError(videoJson.error || 'Failed to load video');
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
                  pointerEvents: 'auto',
                  filter: 'contrast(1.05) brightness(1.02) saturate(1.05)',
                  WebkitFilter: 'contrast(1.05) brightness(1.02) saturate(1.05)',
                  transform: 'translateZ(0)',
                  WebkitTransform: 'translateZ(0)'
                } as React.CSSProperties}
                crossOrigin="anonymous"
                preload="metadata"
              />
              {/* Dynamic Watermark */}
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%,-50%) rotate(-30deg)',
                pointerEvents: 'none', 
                opacity: 0.25, 
                fontSize: '6vw', 
                color: '#fff',
                zIndex: 10,
                textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}>
                {user?.email} — {new Date().toLocaleString()}
              </div>
              
              {/* Large Center Watermark */}
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%,-50%)',
                pointerEvents: 'none', 
                opacity: 0.4, 
                fontSize: '12vw', 
                color: '#fff',
                zIndex: 9,
                textShadow: '4px 4px 8px rgba(0,0,0,0.9), -2px -2px 4px rgba(0,0,0,0.9)',
                fontWeight: 'bold',
                textAlign: 'center',
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '3px',
                textTransform: 'uppercase'
              }}>
                EXCLUSIVE CONTENT
              </div>
              
              {/* Diagonal Watermark */}
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%,-50%) rotate(-30deg)',
                pointerEvents: 'none', 
                opacity: 0.5, 
                fontSize: '8vw', 
                color: '#fff',
                zIndex: 10,
                textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                fontWeight: 'bold',
                letterSpacing: '2px',
                fontFamily: 'Arial, sans-serif'
              }}>
                {user?.email} — {new Date().toLocaleString()}
              </div>
              
              {/* Corner Watermarks */}
              <div style={{ 
                position: 'absolute', 
                top: '5%', 
                right: '5%', 
                pointerEvents: 'none', 
                opacity: 0.6, 
                fontSize: '4vw', 
                color: '#fff',
                zIndex: 10,
                transform: 'rotate(15deg)',
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif'
              }}>
                EXCLUSIVE LEX
              </div>
              
              <div style={{ 
                position: 'absolute', 
                bottom: '5%', 
                left: '5%', 
                pointerEvents: 'none', 
                opacity: 0.5, 
                fontSize: '3vw', 
                color: '#fff',
                zIndex: 10,
                transform: 'rotate(-15deg)',
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif'
              }}>
                {new Date().toLocaleDateString()}
              </div>
              
              {/* Diagonal Watermarks */}
              <div style={{ 
                position: 'absolute', 
                top: '20%', 
                left: '10%', 
                pointerEvents: 'none', 
                opacity: 0.4, 
                fontSize: '3vw', 
                color: '#fff',
                zIndex: 10,
                transform: 'rotate(45deg)',
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif'
              }}>
                PRIVATE CONTENT
              </div>
              
              <div style={{ 
                position: 'absolute', 
                bottom: '20%', 
                right: '10%', 
                pointerEvents: 'none', 
                opacity: 0.4, 
                fontSize: '3vw', 
                color: '#fff',
                zIndex: 10,
                transform: 'rotate(-45deg)',
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif'
              }}>
                COPYRIGHT PROTECTED
              </div>
              
              {/* Additional Large Watermarks */}
              <div style={{ 
                position: 'absolute', 
                top: '10%', 
                left: '50%', 
                transform: 'translateX(-50%)',
                pointerEvents: 'none', 
                opacity: 0.3, 
                fontSize: '6vw', 
                color: '#fff',
                zIndex: 10,
                textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif',
                textAlign: 'center'
              }}>
                DO NOT DISTRIBUTE
              </div>
              
              <div style={{ 
                position: 'absolute', 
                bottom: '10%', 
                left: '50%', 
                transform: 'translateX(-50%)',
                pointerEvents: 'none', 
                opacity: 0.3, 
                fontSize: '5vw', 
                color: '#fff',
                zIndex: 10,
                textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif',
                textAlign: 'center'
              }}>
                EXCLUSIVE LEX CONTENT
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
              
              {/* Permanent Warning Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-blue-500/10 pointer-events-none z-5"></div>
              
              {/* Floating Warning */}
              <div style={{
                position: 'absolute',
                top: '15%',
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                opacity: 0.7,
                fontSize: '3vw',
                color: '#ff0000',
                zIndex: 15,
                textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '10px 20px',
                borderRadius: '10px',
                border: '2px solid #ff0000'
              }}>
                ⚠️ SCREENSHOT PROTECTION ACTIVE ⚠️
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
          
          {/* Screenshot Warning */}
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-semibold">Screenshot Protection Active</h3>
                <p className="text-red-700 text-sm">
                  This content is protected by multiple watermarks and monitoring systems. 
                  Screenshot attempts will be detected and may result in access revocation.
                </p>
              </div>
            </div>
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