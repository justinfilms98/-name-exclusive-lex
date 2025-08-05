"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, getSignedUrl } from '@/lib/supabase';
import { Clock, AlertCircle, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

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
  
  console.log('🔍 DEBUG: WatchPageContent loaded with sessionId:', sessionId);
  
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

    // FORCE REMOVE ANY OVERLAY PLAY BUTTONS (EXCLUDE HERO SECTION)
    const removeOverlays = () => {
      // Only run on watch pages, not hero section
      if (!window.location.pathname.includes('/watch')) return;
      
      // Remove any elements that look like play button overlays
      const overlays = document.querySelectorAll('.absolute.inset-0.flex.items-center.justify-center');
      overlays.forEach(overlay => {
        // Skip if it's in the hero section
        if (overlay.closest('[class*="hero"]')) return;
        
        if (overlay.innerHTML.includes('play') || overlay.innerHTML.includes('pause')) {
          overlay.remove();
        }
      });

      // Remove any white circular buttons
      const whiteButtons = document.querySelectorAll('.bg-white.bg-opacity-20.backdrop-blur-sm.rounded-full');
      whiteButtons.forEach(button => {
        // Skip if it's in the hero section
        if (button.closest('[class*="hero"]')) return;
        button.remove();
      });

      // Remove any elements with play/pause icons
      const playIcons = document.querySelectorAll('svg[class*="play"], svg[class*="pause"]');
      playIcons.forEach(icon => {
        // Skip if it's in the hero section
        if (icon.closest('[class*="hero"]')) return;
        
        const parent = icon.closest('.absolute');
        if (parent) parent.remove();
      });
    };

    // Run immediately and then every second
    removeOverlays();
    const interval = setInterval(removeOverlays, 1000);

    // Add fullscreen change listener
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
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
  const report = async () => {
    console.log('🚨 SCREEN CAPTURE DETECTED!')
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

  const loadPurchase = async () => {
    try {
      const res = await fetch(`/api/get-purchase?session_id=${sessionId}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Unknown error')
        return
      }
      setPurchase(json.purchase)

      // Set permanent access (no expiration)
      setTimeRemaining(0); // No timer needed for permanent access

      // Get protected video URL
      if (json.purchase.CollectionVideo?.id) {
        const videoRes = await fetch(`/api/protected-video?session_id=${sessionId}`)
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

  const handleTimeUpdate = () => {
    const video = document.getElementById('video-player') as HTMLVideoElement;
    if (video) {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = document.getElementById('video-player') as HTMLVideoElement;
    if (video && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      video.currentTime = newTime;
    }
  };

  const toggleFullscreen = () => {
    console.log('🔍 DEBUG: toggleFullscreen called, isFullscreen:', isFullscreen);
    const videoElement = document.getElementById('video-player') as HTMLVideoElement;
    if (!videoElement) {
      console.error('❌ Video element not found');
      return;
    }
    console.log('✅ Video element found:', videoElement);

    if (!isFullscreen) {
      console.log('🚀 Attempting to enter fullscreen...');
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen().then(() => {
          console.log('✅ Fullscreen entered successfully');
        }).catch((err) => {
          console.error('❌ Fullscreen request failed:', err);
        });
      } else if ((videoElement as any).webkitRequestFullscreen) {
        (videoElement as any).webkitRequestFullscreen();
      } else if ((videoElement as any).msRequestFullscreen) {
        (videoElement as any).msRequestFullscreen();
      }
    } else {
      console.log('🚪 Attempting to exit fullscreen...');
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
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
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden screenshot-protected video-container" id="video-container">
          {videoUrl ? (
            <>
              <video
                id="video-player"
                src={videoUrl}
                className={`w-full h-full ${isBlurred ? 'blur-md' : ''}`}
                onEnded={handleVideoEnded}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onMouseMove={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
                onDoubleClick={toggleFullscreen}
                onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  report()
                  return false
                }}
                onDragStart={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  return false
                }}

                style={{
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  userSelect: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserDrag: 'none',
                  MozUserDrag: 'none',
                  msUserDrag: 'none',
                  userDrag: 'none',
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

                        {/* Always Visible Fullscreen Button */}
              {videoUrl && (
                <button
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded-full hover:bg-opacity-100 transition-all duration-200 z-20"
                  title="Toggle Fullscreen"
                  style={{ display: 'block !important' }}
                >
                  {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                </button>
              )}

              {/* Custom Video Controls */}
              {showControls && videoUrl && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300">
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
                    onClick={handlePlayPause}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                  </button>

                  {/* Volume Button */}
                  <button
                    onClick={handleMuteToggle}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>

                  {/* Time Display */}
                  <div className="text-white text-sm">
                    {formatTime(currentTime * 1000)} / {formatTime(duration * 1000)}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                  </button>

                  {/* Watermark */}
                  <div className="text-white text-opacity-50 text-sm">
                    {user?.email} • Exclusive Access
                  </div>
                </div>
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
            <button 
              onClick={() => report()} 
              className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Test Detection System
            </button>
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