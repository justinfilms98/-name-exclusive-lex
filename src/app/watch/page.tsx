"use client";

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';
import MobileFullscreenVideo from '@/components/MobileFullscreenVideo';
import ClientGuards from '@/components/security/ClientGuards';
import RotatingProtectedVideo from '@/components/media/RotatingProtectedVideo';

interface Purchase {
  id: string;
  user_id: string;
  collection_video_id: string;
  stripe_session_id: string;
  created_at: string;
  amount_paid: number;
  CollectionVideo: {
    id: string;
    title: string;
    description: string;
    videoPath: string;
    thumbnail: string;
    price: number;
  };
}

function WatchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams?.get('session_id');
  const { addToast } = useToast();
  
  console.log('🔍 DEBUG: WatchPageContent loaded with sessionId:', sessionId);
  console.log('🔍 DEBUG: IMMEDIATE - Component loaded!');
  console.log('🔍 DEBUG: IMMEDIATE - URL:', window.location.href);
  console.log('🔍 DEBUG: IMMEDIATE - Pathname:', window.location.pathname);
  
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showMobileFullscreen, setShowMobileFullscreen] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    // Extract collection ID from URL path - FIXED LOGIC
    const pathname = window.location.pathname;
    console.log('🔍 DEBUG: Full pathname:', pathname);
    console.log('🔍 DEBUG: Window location:', window.location.href);
    console.log('🔍 DEBUG: Session ID:', sessionId);
    
    // Improved collection ID extraction
    const pathParts = pathname.split('/');
    console.log('🔍 DEBUG: Path parts:', pathParts);
    
    // Find the collection ID (should be the last part before any query params)
    let resolvedCollectionId = pathParts[pathParts.length - 1];
    if (resolvedCollectionId && resolvedCollectionId.includes('?')) {
      resolvedCollectionId = resolvedCollectionId.split('?')[0];
    }
    setCollectionId(resolvedCollectionId || null);
    
    console.log('🔍 DEBUG: Collection ID extracted:', resolvedCollectionId);
    console.log('🔍 DEBUG: Collection ID type:', typeof resolvedCollectionId);
    console.log('🔍 DEBUG: Collection ID length:', resolvedCollectionId?.length);

    // Add a small delay to ensure everything is loaded
    setTimeout(() => {
      console.log('🔍 DEBUG: About to call loadPurchase with collectionId:', resolvedCollectionId);
      loadPurchase(resolvedCollectionId);
    }, 100);
    
    // Get current user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getSession();

    // FORCE REMOVE ANY OVERLAY PLAY BUTTONS (EXCLUDE HERO SECTION)
    const removeOverlays = () => {
      // Only run on watch pages, not hero section
      if (!window.location.pathname.includes('/watch')) return;
      
      // Remove any elements that look like play button overlays
      const overlays = document.querySelectorAll('.absolute.inset-0.flex.items-center.justify-center');
      overlays.forEach(overlay => {
        // Skip if it's in the hero section
        if (overlay.closest('[class*="hero"]')) return;
        
        // Check if this overlay contains play button elements
        const playButtons = overlay.querySelectorAll('button, [role="button"], .play-button, .play-overlay');
        if (playButtons.length > 0) {
          console.log('🔍 DEBUG: Removing overlay with play buttons');
          overlay.remove();
        }
      });
    };

    // Run immediately and then periodically
    removeOverlays();
    const interval = setInterval(removeOverlays, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      setShowMobileFullscreen(true);
      return;
    }

    try {
      if (!containerRef.current) return;
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Screenshot detection
  const report = async () => {
    console.log('�� SCREEN CAPTURE DETECTED!')
    addToast('Screen capture detected - access will be revoked', 'error')
    
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
      // Redirect to access denied page immediately
      router.push('/unauthorized?reason=screen_capture')
    } else {
      addToast(`Screen capture detected (${json.strike_count}/${json.threshold})`, 'error')
    }
  }

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

  useEffect(() => {
    // Prevent screenshots with CSS
    const preventScreenshots = () => {
      // Add CSS to prevent screenshots
      const style = document.createElement('style')
      style.textContent = `
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-user-drag: none !important;
          -khtml-user-drag: none !important;
          -moz-user-drag: none !important;
          -o-user-drag: none !important;
          user-drag: none !important;
        }
        
        video, img {
          pointer-events: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        
        /* Prevent right-click */
        * {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -khtml-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
      `
      document.head.appendChild(style)
    }

    // Add aggressive watermarks
    const addWatermarks = () => {
      const watermark = document.createElement('div')
      watermark.id = 'aggressive-watermark'
      watermark.style.cssText = `
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) rotate(-30deg) !important;
        font-size: 8vw !important;
        color: rgba(255, 0, 0, 0.8) !important;
        z-index: 9999 !important;
        pointer-events: none !important;
        font-weight: bold !important;
        text-shadow: 3px 3px 6px rgba(0,0,0,0.9) !important;
        font-family: Arial, sans-serif !important;
        white-space: nowrap !important;
        mix-blend-mode: multiply !important;
      `
      watermark.textContent = `${user?.email || 'USER'} - ${new Date().toLocaleString()} - DO NOT SCREENSHOT`
      document.body.appendChild(watermark)

      // Add multiple watermarks
      const positions = [
        { top: '10%', left: '10%', rotation: '-15deg' },
        { top: '10%', right: '10%', rotation: '15deg' },
        { bottom: '10%', left: '10%', rotation: '-45deg' },
        { bottom: '10%', right: '10%', rotation: '45deg' },
        { top: '50%', left: '5%', rotation: '90deg' },
        { top: '50%', right: '5%', rotation: '-90deg' }
      ]

      positions.forEach((pos, index) => {
        const wm = document.createElement('div')
        wm.style.cssText = `
          position: fixed !important;
          top: ${pos.top} !important;
          ${pos.left ? `left: ${pos.left} !important;` : ''}
          ${pos.right ? `right: ${pos.right} !important;` : ''}
          transform: rotate(${pos.rotation}) !important;
          font-size: 4vw !important;
          color: rgba(255, 0, 0, 0.6) !important;
          z-index: 9998 !important;
          pointer-events: none !important;
          font-weight: bold !important;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8) !important;
          font-family: Arial, sans-serif !important;
          white-space: nowrap !important;
          mix-blend-mode: multiply !important;
        `
        wm.textContent = `EXCLUSIVE CONTENT - ${user?.email || 'PROTECTED'}`
        document.body.appendChild(wm)
      })
    }

    // Enhanced screen capture detection
    const onKey = (e: KeyboardEvent) => {
      // Windows Snipping Tool shortcuts
      if (e.key === 'PrintScreen' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') || // DevTools
          (e.ctrlKey && e.shiftKey && e.key === 'C') || // DevTools
          (e.ctrlKey && e.shiftKey && e.key === 'J') || // DevTools
          (e.key === 'F12') || // F12
          (e.ctrlKey && e.key === 'U')) { // View source
        e.preventDefault()
        e.stopPropagation()
        report()
        return false
      }

      // Fullscreen toggle with F key
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }

      // macOS screenshot shortcuts
      if (navigator.platform.includes('Mac')) {
        if ((e.metaKey && e.shiftKey && e.key === '3') || // Full screenshot
            (e.metaKey && e.shiftKey && e.key === '4') || // Selection screenshot
            (e.metaKey && e.shiftKey && e.key === '5')) { // Screenshot menu
          e.preventDefault()
          e.stopPropagation()
          report()
          return false
        }
      }

      // Windows Snipping Tool
      if (e.key === 'S' && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        report()
        return false
      }
    }
    
    const onCtx = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      report()
      return false
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

    // Detect when user switches to other applications
    const onFocusChange = () => {
      if (!document.hasFocus()) {
        report()
      }
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
          navigator.userAgent.includes('Fraps') ||
          navigator.userAgent.includes('SnippingTool') ||
          navigator.userAgent.includes('Snip') ||
          navigator.userAgent.includes('ShareX') ||
          navigator.userAgent.includes('Greenshot') ||
          navigator.userAgent.includes('Lightshot')) {
        report()
      }
    }

    // Detect iPhone screenshot attempts
    const detectIPhoneScreenshot = () => {
      // iPhone screenshot detection via device orientation and screen size changes
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        // Monitor for sudden screen size changes (iPhone screenshot behavior)
        let lastScreenSize = window.innerWidth + 'x' + window.innerHeight
        
        const checkScreenSize = () => {
          const currentSize = window.innerWidth + 'x' + window.innerHeight
          if (currentSize !== lastScreenSize) {
            // Screen size changed - possible screenshot
            report()
          }
          lastScreenSize = currentSize
        }
        
        // Check every 100ms on iOS devices
        setInterval(checkScreenSize, 100)
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

      // Detect snipping tool window
      if (window.name.includes('SnippingTool') || 
          document.title.includes('Snipping Tool') ||
          window.name.includes('Snip') ||
          document.title.includes('Snip')) {
        report()
      }
    }

    // Monitor for snipping tool processes (Windows)
    const detectSnippingTools = () => {
      // Check for common snipping tool indicators
      const suspiciousElements = document.querySelectorAll('[class*="snipping"], [id*="snipping"], [class*="snip"], [id*="snip"]')
      if (suspiciousElements.length > 0) {
        report()
      }

      // Check for clipboard content that might be from snipping tools
      if (navigator.clipboard) {
        navigator.clipboard.readText().then(text => {
          if (text.includes('Snipping Tool') || text.includes('Snip')) {
            report()
          }
        }).catch(() => {
          // Ignore permission errors
        })
      }
    }

    // Detect iOS screenshot gestures
    const detectIOSGestures = () => {
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        // Monitor for volume + power button combination (iPhone screenshot)
        let volumeDownPressed = false
        let powerPressed = false
        
        document.addEventListener('keydown', (e) => {
          if (e.key === 'VolumeDown' || e.key === 'AudioVolumeDown') {
            volumeDownPressed = true
          }
          if (e.key === 'Power' || e.key === 'PowerOff') {
            powerPressed = true
          }
          
          // If both are pressed simultaneously, it's likely a screenshot
          if (volumeDownPressed && powerPressed) {
            report()
            volumeDownPressed = false
            powerPressed = false
          }
        })

        // Reset after a short delay
        setTimeout(() => {
          volumeDownPressed = false
          powerPressed = false
        }, 1000)
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

    // Monitor every 500ms for more aggressive detection
    const monitorInterval = setInterval(monitorActivity, 500)

    // Monitor for screen recording attempts every second
    const screenRecordingInterval = setInterval(detectScreenRecording, 1000)

    // Monitor for snipping tool processes every second
    const snippingToolInterval = setInterval(detectSnippingTools, 1000)

    // Additional aggressive monitoring
    let lastScreenSize = window.innerWidth + 'x' + window.innerHeight
    const aggressiveMonitor = setInterval(() => {
      // Check for any suspicious activity
      if (document.hidden || !document.hasFocus()) {
        report()
      }
      
      // Check for screen size changes (common in screenshots)
      const currentSize = window.innerWidth + 'x' + window.innerHeight
      if (lastScreenSize !== currentSize) {
        report()
      }
      lastScreenSize = currentSize
    }, 250) // Check every 250ms

    // Initialize platform-specific detection
    detectIPhoneScreenshot()
    detectIOSGestures()

    // Apply CSS protection and watermarks
    preventScreenshots()
    addWatermarks()

    document.addEventListener('keydown', onKey, true)
    document.addEventListener('contextmenu', onCtx, true)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocusChange)
    document.addEventListener('copy', onClipboardChange)
    
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('contextmenu', onCtx, true)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocusChange)
      document.removeEventListener('copy', onClipboardChange)
      clearInterval(monitorInterval)
      clearInterval(screenRecordingInterval)
      clearInterval(snippingToolInterval)
      clearInterval(aggressiveMonitor)
      
      // Remove watermarks
      const watermarks = document.querySelectorAll('#aggressive-watermark, [style*="position: fixed"]')
      watermarks.forEach(wm => wm.remove())
    }
  }, [sessionId, addToast, router, user])

  const loadPurchase = async (collectionId: string | undefined) => {
    if (!collectionId || !sessionId) {
      console.log('🔍 DEBUG: Missing collectionId or sessionId');
      setError('Missing collection ID or session ID');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 DEBUG: Loading purchase for collection:', collectionId);
      console.log('🔍 DEBUG: Session ID:', sessionId);

      // First, get the purchase
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select(`
          id,
          user_id,
          collection_video_id,
          stripe_session_id,
          created_at,
          amount_paid,
          CollectionVideo (
            id,
            title,
            description,
            video_path,
            thumbnail_path,
            price
          )
        `)
        .eq('stripe_session_id', sessionId)
        .eq('is_active', true)
        .maybeSingle();

      if (purchaseError) {
        console.error('❌ DEBUG: Purchase error:', purchaseError);
        setError('Failed to load purchase data');
        setLoading(false);
        return;
      }

      if (!purchaseData) {
        console.log('❌ DEBUG: No purchase found for session:', sessionId);
        setError('Purchase not found or expired');
      setLoading(false);
        return;
      }

      console.log('🔍 DEBUG: Purchase data loaded:', purchaseData);

      let videoPathToSet = '';
      if (purchaseData.CollectionVideo && typeof purchaseData.CollectionVideo === 'object' && ('video_path' in purchaseData.CollectionVideo || 'media_filename' in purchaseData.CollectionVideo)) {
        const collectionVideo = purchaseData.CollectionVideo as any;
        const resolvedPath = collectionVideo.media_filename || collectionVideo.video_path;
        videoPathToSet = resolvedPath || '';
        setVideoPath(resolvedPath || null);
      }

      // Transform the data to match the Purchase interface
      const collectionVideo = purchaseData.CollectionVideo as any;
      const transformedPurchase: Purchase = {
        id: purchaseData.id,
        user_id: purchaseData.user_id,
        collection_video_id: purchaseData.collection_video_id,
        stripe_session_id: purchaseData.stripe_session_id,
        created_at: purchaseData.created_at,
        amount_paid: purchaseData.amount_paid,
        CollectionVideo: {
          id: collectionVideo?.id || '',
          title: collectionVideo?.title || '',
          description: collectionVideo?.description || '',
          videoPath: videoPathToSet,
          thumbnail: collectionVideo?.thumbnail_path || '',
          price: collectionVideo?.price || 0
        }
      };

      setPurchase(transformedPurchase);
      setLoading(false);
    } catch (error) {
      console.error('❌ DEBUG: Load purchase error:', error);
      setError('Failed to load content');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading content...</p>
        </div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-red-400 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto" />
        </div>
          <h2 className="text-xl font-semibold mb-2">Access Error</h2>
          <p className="text-gray-300 mb-4">{error || 'Content not found'}</p>
          <button
            onClick={() => router.push('/collections')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-black"
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      {/* Header */}
      <div className="bg-black bg-opacity-75 text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
          <div>
          <h1 className="text-lg font-semibold">{purchase.CollectionVideo.title}</h1>
          <p className="text-sm text-gray-300">Exclusive Content</p>
          </div>
        <div className="text-right">
          <p className="text-sm text-gray-300">Permanent Access</p>
          <p className="text-lg font-mono text-green-400">∞</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20">
      {/* Video Player */}
        <div 
          ref={containerRef}
          className="relative bg-black"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            if (isPlaying) {
              setShowControls(false);
            }
          }}
        >
              <RotatingProtectedVideo
            ref={videoRef}
            collectionId={collectionId || ''}
            videoPath={videoPath}
            className="w-full h-screen object-contain"
            onContextMenu={(e) => e.preventDefault()}
            onPlay={handlePlay}
            onPause={handlePause}
                onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
                autoPlay
                muted
                playsInline
                webkit-playsinline="true"
                style={{
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  userSelect: 'none',
            }}
          >
            Your browser does not support the video tag.
          </RotatingProtectedVideo>

              {/* Custom Video Controls */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              {/* Progress Bar */}
              <div 
                className="w-full h-1 bg-gray-600 rounded-full cursor-pointer mb-4"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-red-500 rounded-full relative"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause Button */}
                  <button
                  onClick={handleVideoClick}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                  {isPlaying ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                  </button>

                  {/* Volume Button */}
                  <button
                    onClick={handleMuteToggle}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                  {isMuted ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                  </button>

                  {/* Time Display */}
                  <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-gray-300 transition-colors"
                  title="Toggle Fullscreen (F)"
                >
                  {isFullscreen ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                    </svg>
                  )}
                  </button>

                  {/* Watermark */}
                  <div className="text-white text-opacity-50 text-sm">
                    {user?.email} • Exclusive Access
                  </div>
                </div>
              </div>
            </div>
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
            <button 
              onClick={() => report()} 
              className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Test Detection System
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <ClientGuards>
        <WatchPageContent />
      </ClientGuards>
    </Suspense>
  );
} 