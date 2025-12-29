"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FSItem = {
  id?: string;
  type: 'video' | 'photo';
  url: string;
  title?: string;
  thumbnail?: string | null;
};

interface FSPayload {
  items: FSItem[];
  startIndex?: number;
  title?: string;
}

export default function FullscreenPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [payload, setPayload] = useState<FSPayload | null>(null);
  const [index, setIndex] = useState(0);
  const [isVertical, setIsVertical] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenOverlay, setShowFullscreenOverlay] = useState(true);
  const hasUnmutedOnceRef = useRef(false);
  const [showTapHint, setShowTapHint] = useState(false);
  const isTogglingRef = useRef(false); // Prevent double-trigger of togglePlay
  const [isMobile, setIsMobile] = useState(false); // Detect mobile devices

  useEffect(() => {
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.documentElement.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    // Try sessionStorage first
    try {
      const raw = sessionStorage.getItem('fullscreen-payload');
      if (raw) {
        const data: FSPayload = JSON.parse(raw);
        if (data && data.items?.length) {
          setPayload(data);
          setIndex(Math.max(0, Math.min(data.items.length - 1, data.startIndex || 0)));
          return;
        }
      }
    } catch {}
    
    // Fallback from URL param - with defensive parsing
    try {
      let p = params?.get('p');
      
      // Fix for /fullscreenp=... bug (missing '?')
      if (!p) {
        const pathname = window.location.pathname;
        const search = window.location.search;
        
        // Check if pathname contains "fullscreenp="
        if (pathname.includes('fullscreenp=')) {
          const match = pathname.match(/fullscreenp=([^/]+)/);
          if (match && match[1]) {
            p = decodeURIComponent(match[1]);
          }
        }
        
        // Also check search params without '?'
        if (!p && search && search.startsWith('p=')) {
          p = search.substring(2);
        }
      }
      
      if (p) {
        const decoded = JSON.parse(atob(p)) as FSPayload;
        if (decoded && decoded.items?.length) {
          setPayload(decoded);
          setIndex(Math.max(0, Math.min(decoded.items.length - 1, decoded.startIndex || 0)));
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to parse fullscreen payload:', err);
      }
    }
  }, [params]);

  // Detect iOS Safari and mobile devices
  useEffect(() => {
    try {
      const ua = navigator.userAgent || '';
      const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      setIsIOS(isIOSDevice && isSafari);
      
      // Detect mobile devices (iOS, Android, etc.)
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || 
                            (typeof window !== 'undefined' && window.innerWidth < 768);
      setIsMobile(isMobileDevice);
    } catch {}
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      if (isCurrentlyFullscreen) {
        setShowFullscreenOverlay(false);
        // On mobile, we use in-page fullscreen, so no need to enable native controls
        // On desktop, native fullscreen is handled by browser
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const items = payload?.items || [];
  const item = items[index];

  // When item changes, set up video listeners
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !item || item.type !== 'video') return;
    setIsBuffering(true);
    setShowControls(true);
    const onLoaded = () => {
      try {
        const t = el.currentTime;
        el.currentTime = Math.max(0, t + 0.001);
        const vw = el.videoWidth || 0;
        const vh = el.videoHeight || 0;
        setIsVertical(vh > vw);
      } catch {}
      el.muted = true;
      setIsMuted(true);
      el.play().then(() => { setIsPlaying(true); setIsBuffering(false); scheduleHideControls(); }).catch(() => { setIsPlaying(false); setIsBuffering(false); setShowControls(true); });
    };
    const onCanPlay = () => setIsBuffering(false);
    const onWaiting = () => setIsBuffering(true);
    const onTime = () => { if (!isSeeking) setCurrentTime(el.currentTime); };
    const onMeta = () => { setDuration(el.duration || 0); };
    el.addEventListener('loadedmetadata', onLoaded, { once: true });
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    return () => {
      try {
        el.removeEventListener('loadedmetadata', onLoaded as any);
        el.removeEventListener('canplay', onCanPlay as any);
        el.removeEventListener('waiting', onWaiting as any);
        el.removeEventListener('timeupdate', onTime as any);
        el.removeEventListener('loadedmetadata', onMeta as any);
      } catch {}
    };
  }, [item, isSeeking]);

  // Auto-hide controls after 4s of no interaction while playing (longer for better UX)
  useEffect(() => {
    if (!isPlaying) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 4000);
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [isPlaying, currentTime]);

  const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const title = useMemo(() => item?.title || payload?.title || 'Media', [item, payload]);

  const close = () => {
    const el = videoRef.current;
    try { el?.pause(); } catch {}
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if ((document as any).webkitFullscreenElement) {
      (document as any).webkitExitFullscreen();
    }
    router.back();
  };

  const handleRequestFullscreen = async () => {
    const el = videoRef.current;
    const container = containerRef.current;
    
    if (!el && !container) return;

    try {
      // IMPORTANT: On iOS/mobile, we use custom fullscreen instead of native fullscreen
      // Reason: Native iOS fullscreen (webkitEnterFullscreen) has severe limitations:
      // 1. Hides all custom UI overlays (we can't show our TikTok-style play icon)
      // 2. Causes double-trigger bugs when mixing native controls with custom overlays
      // 3. Doesn't allow proper tap-to-toggle with visual feedback
      // Solution: Use in-app fullscreen modal (position: fixed; inset: 0) with full control
      // This allows us to implement TikTok-like tap-to-play with translucent play icon
      if (isMobile) {
        setShowFullscreenOverlay(false);
        setIsFullscreen(true); // Mark as fullscreen state for our UI logic
        return;
      }

      // Desktop/Android: use standard fullscreen API on container
      if (container) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen();
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen();
        }
        setShowFullscreenOverlay(false);
      }
    } catch (err) {
      // Fullscreen request failed, but keep visual fullscreen
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Fullscreen request failed:', err);
      }
      setShowFullscreenOverlay(false);
    }
  };

  const next = () => setIndex((i) => (i + 1) % items.length);
  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);

  // TikTok-like tap-to-toggle: single handler with debounce to prevent double-trigger
  const togglePlay = async (e?: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    // Prevent double-trigger: if already toggling, ignore
    if (isTogglingRef.current) {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      return;
    }
    
    // Stop event propagation to prevent container/video onClick from also firing
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    isTogglingRef.current = true;
    const el = videoRef.current; 
    if (!el) {
      isTogglingRef.current = false;
      return;
    }
    
    // Simple toggle: if paused, play; if playing, pause
    if (el.paused) {
      try {
        await el.play();
        setIsPlaying(true);
        if (el.muted) { el.muted = false; setIsMuted(false); }
        scheduleHideControls();
      } catch {
        setShowControls(true);
      }
    } else {
      // If already playing but muted, first interaction should unmute (don't pause)
      if (el.muted) { 
        el.muted = false; 
        setIsMuted(false); 
        scheduleHideControls(); 
        isTogglingRef.current = false;
        return; 
      }
      // Pause the video and immediately update state
      // Update state immediately before pausing to ensure UI updates right away
      setIsPlaying(false);
      el.pause();
      setShowControls(true);
    }
    
    // Reset toggle guard after delay (250ms debounce for reliable single-tap)
    setTimeout(() => {
      isTogglingRef.current = false;
    }, 250);
  };

  const toggleMute = () => {
    const el = videoRef.current; if (!el) return;
    const willBeMuted = !el.muted;
    el.muted = willBeMuted;
    setIsMuted(willBeMuted);
    if (!willBeMuted) {
      try {
        el.volume = 1.0;
        // iOS sometimes requires a play() call in the same gesture that unmutes
        if (el.paused) {
          el.play().catch(() => {});
        } else {
          // Nudge playback to ensure audio routing engages
          el.currentTime = el.currentTime;
          el.play().catch(() => {});
        }
      } catch {}
    }
  };

  const ensureAudioOnGesture = () => {
    const el = videoRef.current; if (!el) return;
    if (!isMuted) return;
    try {
      el.muted = false;
      setIsMuted(false);
      el.volume = 1.0;
      el.play().catch(() => {});
      hasUnmutedOnceRef.current = true;
    } catch {}
  };

  if (!payload || !item) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
        <div>Loading…</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-black z-[100000]"
      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
      onMouseMove={() => { 
        if (!(isMobile && isFullscreen)) {
          setShowControls(true); 
          scheduleHideControls(); 
        }
      }}
      onTouchMove={() => { 
        if (!(isMobile && isFullscreen)) {
          setShowControls(true); 
          scheduleHideControls(); 
        }
      }}
      onTouchStart={() => { 
        if (!(isMobile && isFullscreen)) {
          setShowControls(true); 
        }
        ensureAudioOnGesture(); 
      }}
      // TikTok-like tap-to-toggle: use onPointerUp for reliable single-tap on mobile fullscreen
      // This prevents double-trigger by using only one event type
      onPointerUp={(e) => {
        if (item.type === 'video' && isMobile && isFullscreen) {
          const target = e.target as HTMLElement;
          // Only toggle if clicking on video container (not on back button or other controls)
          // Skip buttons and play button are removed - only tap-to-toggle remains
          if (target.tagName === 'VIDEO' || target.closest('.absolute.inset-0') && !target.closest('button')) {
            e.stopPropagation();
            e.preventDefault();
            togglePlay(e);
          }
        }
      }}
      // Keep onClick for desktop/non-fullscreen
      onClick={(e) => { 
        if (item.type === 'video' && !(isMobile && isFullscreen)) {
          if (!isFullscreen) {
            setShowControls(true); 
            if (isIOS) ensureAudioOnGesture(); 
            scheduleHideControls(); 
          }
        }
      }}
    >
      {/* Header - hide on mobile fullscreen to avoid interference */}
      {!(isMobile && isFullscreen) && (
        <div className={`absolute top-[env(safe-area-inset-top)] left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={close} 
            className="text-white px-3 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors z-50"
            aria-label="Back"
          >
            Back
          </button>
          <div className="text-white text-sm truncate max-w-[60%]">{title}</div>
          <div className="w-16" />
        </div>
      )}
      
      {/* Minimal back button for mobile fullscreen - top left corner only */}
      {isMobile && isFullscreen && (
        <button 
          onClick={close} 
          className="absolute top-[env(safe-area-inset-top)] left-4 z-50 text-white px-3 py-2 bg-black/50 rounded backdrop-blur-sm"
          aria-label="Back"
        >
          Back
        </button>
      )}

      {/* Main - TikTok-style tap anywhere to toggle on mobile fullscreen */}
      <div 
        className="absolute inset-0"
        onPointerUp={(e) => {
          // TikTok-style: tap anywhere on container to toggle play/pause on mobile fullscreen
          if (item.type === 'video' && isMobile && isFullscreen) {
            const target = e.target as HTMLElement;
            // Only toggle if not clicking on a button (back button, etc.)
            if (!target.closest('button')) {
              e.stopPropagation();
              e.preventDefault();
              togglePlay(e);
            }
          }
        }}
      >
        {item.type === 'photo' ? (
          <img src={item.url} alt={item.title || ''} className="w-[100vw] h-[100dvh] object-contain" />
        ) : (
          <video
            ref={videoRef}
            src={item.url}
            poster={item.thumbnail || '/placeholder-thumbnail.jpg'}
            className={`w-[100vw] h-[100dvh] ${isVertical ? 'object-cover' : 'object-cover'} ios-video-fullscreen`}
            autoPlay
            muted={isMuted}
            playsInline
            webkit-playsinline="true"
            preload="metadata"
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            // Always disable native controls on mobile fullscreen for TikTok-style experience
            controls={false}
            onPlay={() => {
              setIsPlaying(true);
            }}
            onPause={() => {
              setIsPlaying(false);
            }}
            style={{ 
              backgroundColor: 'black', 
              position: 'fixed', 
              inset: 0, 
              pointerEvents: isMobile && isFullscreen ? 'none' : 'auto' // Video not clickable on mobile fullscreen, container handles taps
            }}
            // Remove onClick from video - tap handler is on container for mobile fullscreen
            onClick={(e) => { 
              if (!(isMobile && isFullscreen) && !isFullscreen) {
                e.stopPropagation();
                togglePlay(e);
              }
            }}
          />
        )}
      </div>


      {/* Arrows - hide on mobile fullscreen to avoid interference */}
      {items.length > 1 && !(isMobile && isFullscreen) && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 rounded-full text-white">◀</button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 rounded-full text-white">▶</button>
        </>
      )}

      {/* Controls if video - Completely hide all controls on mobile fullscreen */}
      {item.type === 'video' && !(isMobile && isFullscreen) && (
        <>
          {/* Custom controls - only show on desktop or non-fullscreen */}
          <div className={`absolute bottom-[max(env(safe-area-inset-bottom),0px)] left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between pointer-events-auto transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} z-[100]`}>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                e.preventDefault();
                togglePlay(e); 
              }} 
              onPointerDown={(e) => { 
                e.stopPropagation(); 
                e.preventDefault();
                togglePlay(e); 
              }}
              className="text-white px-4 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors touch-manipulation" 
              aria-label={isPlaying ? 'Pause' : 'Play'}
              style={{ touchAction: 'manipulation' }}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleMute(); }} 
              className="text-white px-4 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors" 
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
          {/* Progress bar - only show on desktop or non-fullscreen */}
          <div
            className={`absolute left-0 right-0 px-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} z-[100]`}
            style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
            onMouseDown={(e) => {
              const el = videoRef.current; if (!el) return; setIsSeeking(true);
              const rect = (e.currentTarget.firstChild as HTMLElement).getBoundingClientRect();
              const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
              const time = (x / rect.width) * (duration || 0);
              el.currentTime = time; setCurrentTime(time);
            }}
            onMouseMove={(e) => {
              if (!isSeeking) return; const el = videoRef.current; if (!el) return;
              const rect = (e.currentTarget.firstChild as HTMLElement).getBoundingClientRect();
              const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
              const time = (x / rect.width) * (duration || 0);
              el.currentTime = time; setCurrentTime(time);
            }}
            onMouseUp={() => setIsSeeking(false)}
            onTouchStart={(e) => {
              const el = videoRef.current; if (!el) return; setIsSeeking(true);
              const touch = e.touches[0]; const rect = (e.currentTarget.firstChild as HTMLElement).getBoundingClientRect();
              const x = Math.min(Math.max(touch.clientX - rect.left, 0), rect.width);
              const time = (x / rect.width) * (duration || 0);
              el.currentTime = time; setCurrentTime(time);
            }}
            onTouchMove={(e) => {
              if (!isSeeking) return; const el = videoRef.current; if (!el) return;
              const touch = e.touches[0]; const rect = (e.currentTarget.firstChild as HTMLElement).getBoundingClientRect();
              const x = Math.min(Math.max(touch.clientX - rect.left, 0), rect.width);
              const time = (x / rect.width) * (duration || 0);
              el.currentTime = time; setCurrentTime(time);
            }}
            onTouchEnd={() => setIsSeeking(false)}
          >
            <div className="w-full h-2 bg-white/20 rounded-full">
              <div className="h-2 bg-white rounded-full" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-white/70 text-xs">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </>
      )}

      {/* Buffering */}
      {item.type === 'video' && isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Center Tap-to-Play overlay when not playing - hide in fullscreen on mobile */}
      {item.type === 'video' && !isPlaying && !(isFullscreen && isMobile) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlay(e); }} 
            onTouchStart={(e) => { e.stopPropagation(); togglePlay(e); }}
            className="pointer-events-auto text-white w-[70vw] max-w-[320px] px-6 py-4 bg-white/10 rounded-full border border-white/30 text-base"
          >
            Tap to Play
          </button>
        </div>
      )}
      
      {/* TikTok-style play icon overlay - light opacity play button only when paused */}
      {/* Tap anywhere on video container to toggle play/pause - overlay is non-interactive */}
      {item.type === 'video' && isFullscreen && isMobile && !isPlaying && (
        <div 
          className="pointer-events-none absolute inset-0 flex items-center justify-center z-[150] transition-opacity duration-200"
        >
          {/* Light opacity translucent play icon (TikTok style) - purely visual, no click handler */}
          <div className="rounded-full bg-black/40 p-5">
            <svg 
              width="36" 
              height="36" 
              viewBox="0 0 24 24" 
              fill="white" 
              opacity="0.9"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* iOS unmute prompt - hide on mobile fullscreen to avoid interference */}
      {item.type === 'video' && isMuted && !(isMobile && isFullscreen) && (
        <div className="absolute inset-x-0 bottom-[max(env(safe-area-inset-bottom),1.5rem)] z-40 flex justify-center pointer-events-none">
          <button
            className="pointer-events-auto text-white px-5 py-3 bg-white/10 rounded-full border border-white/30 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); ensureAudioOnGesture(); setShowControls(true); }}
            onTouchStart={(e) => { e.stopPropagation(); ensureAudioOnGesture(); setShowControls(true); }}
          >
            Tap for sound
          </button>
        </div>
      )}

      {/* Fullscreen overlay button */}
      {showFullscreenOverlay && !isFullscreen && (
        <button
          onClick={handleRequestFullscreen}
          onTouchStart={handleRequestFullscreen}
          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-lg font-medium z-50 backdrop-blur-sm"
          aria-label="Tap for Fullscreen"
        >
          <div className="bg-white/10 px-6 py-4 rounded-full border border-white/30 backdrop-blur-md">
            Tap for Fullscreen
          </div>
        </button>
      )}

    </div>
  );
}

function formatTime(seconds: number) {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function scheduleHideControls() {
  // Controls auto-hide is handled by useEffect-based auto-hide
  // This function is kept for compatibility but does nothing
}


