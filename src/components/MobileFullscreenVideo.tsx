"use client";

import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileFullscreenVideoProps {
  videoUrl: string;
  isOpen: boolean;
  // Called when user exits fullscreen. Provides last playback time and whether it was playing.
  onClose: (lastTime?: number, wasPlaying?: boolean) => void;
  title?: string;
  isVertical?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  // Optional start time to resume from when opening
  startTime?: number;
}

export default function MobileFullscreenVideo({ 
  videoUrl, 
  isOpen, 
  onClose, 
  title,
  isVertical = false,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  startTime,
}: MobileFullscreenVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const tapLockRef = useRef<boolean>(false);

  // Lock background scroll when modal is open (iOS fullscreen modal)
  useEffect(() => {
    if (isOpen) {
      // Prevent background scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      // Restore background scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      const el = videoRef.current;
      
      // iOS-friendly video attributes for autoplay
      el.muted = true; // Required for autoplay on mobile
      el.playsInline = true;
      
      // Event listeners for play/pause state
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      
      el.addEventListener('play', onPlay);
      el.addEventListener('pause', onPause);
      
      // Seek to requested start time once metadata is ready
      const onLoadedMetadata = () => {
        if (typeof startTime === 'number' && !Number.isNaN(startTime)) {
          try {
            el.currentTime = Math.max(0, startTime);
          } catch (_) { /* no-op */ }
        }
        // Nudge a frame to avoid black frame on iOS
        try {
          const t = el.currentTime;
          el.currentTime = Math.max(0, t + 0.001);
        } catch (_) { /* no-op */ }
      };
      el.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });

      // Try autoplay (muted is required on mobile)
      const tryPlay = async () => {
        try {
          await el.play();
        } catch {
          // Autoplay can be blocked; user tap will start it
          setIsPlaying(false);
        }
      };
      tryPlay();

      return () => {
        el.removeEventListener('play', onPlay);
        el.removeEventListener('pause', onPause);
        el.removeEventListener('loadedmetadata', onLoadedMetadata as any);
      };
    }

  }, [isOpen, startTime]);

  // TikTok-style tap-to-toggle: single handler prevents double-trigger on iOS
  // Only one tap target (container) controls playback; overlay icon is non-interactive
  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;

    // Prevent double toggles on iOS Safari
    if (tapLockRef.current) return;
    tapLockRef.current = true;
    setTimeout(() => (tapLockRef.current = false), 250);

    try {
      if (v.paused) {
        await v.play();
      } else {
        v.pause();
      }
    } catch {
      // ignore playback errors
    }
  };


  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      // Detect video dimensions for proper orientation handling
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      setVideoDimensions({ width, height });
    }
  };



  const handleExitFullscreen = () => {
    if (videoRef.current) {
      const t = videoRef.current.currentTime || 0;
      const wasPlaying = isPlaying;
      // Ensure we stop audio before closing
      try { videoRef.current.pause(); } catch (_) { /* no-op */ }
      onClose(t, wasPlaying);
    } else {
      onClose(0, false);
    }
  };

  const handleNext = () => {
    if (onNext && hasNext) {
      onNext();
    }
  };

  const handlePrevious = () => {
    if (onPrevious && hasPrevious) {
      onPrevious();
    }
  };

  // Determine if video is vertical based on dimensions
  const isVideoVertical = videoDimensions.height > videoDimensions.width || isVertical;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black z-[99999] flex flex-col"
    >
      {/* Header - always visible for exit button */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleExitFullscreen}
            className="text-white hover:text-gray-300 transition-colors p-2 bg-black bg-opacity-50 rounded-full z-20"
          >
            <X size={24} />
          </button>
          {title && (
            <h2 className="text-white text-lg font-medium truncate max-w-xs">
              {title}
            </h2>
          )}
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Video Container - TikTok-style tap anywhere to toggle */}
      {/* iOS fullscreen modal: Custom overlay (inset:0; height:100dvh) instead of requestFullscreen */}
      {/* This avoids conflicts with native iOS fullscreen controls that cause double-toggle */}
      <div 
        className="relative w-full h-full bg-black select-none flex-1 flex items-center justify-center"
        style={{ 
          inset: 0, 
          height: '100dvh',
          width: '100vw'
        }}
        onPointerUp={togglePlay}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className={`w-full h-full ${
            isVideoVertical 
              ? 'object-cover' 
              : 'object-contain'
          }`}
          onContextMenu={(e) => e.preventDefault()}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
          muted={isMuted}
          autoPlay
          playsInline
          webkit-playsinline="true"
          disablePictureInPicture
          controls={false}
          controlsList="nodownload nofullscreen noremoteplayback"
          style={{
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none',
            pointerEvents: 'none', // Video itself is not clickable, container handles taps
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            objectFit: isVideoVertical ? 'cover' : 'contain',
          }}
        />

        {/* TikTok-style overlay icon (NOT clickable - pointer-events-none) */}
        {/* When paused: show centered translucent play icon with light opacity */}
        {/* When playing: fade icon out */}
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
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

        {/* Navigation Arrows */}
        {hasPrevious && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 z-20"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 z-20"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Bottom controls - hidden on mobile for TikTok-style experience */}
      {/* Only show header (back button) and translucent play icon overlay */}
      {/* All controls removed to match TikTok: tap anywhere to toggle, no visible buttons */}
    </div>
  );
} 