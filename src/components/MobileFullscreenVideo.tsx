"use client";

import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toggleGuardRef = useRef<boolean>(false);
  const lastToggleTimeRef = useRef<number>(0);

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
      // Start muted to satisfy autoplay; user can unmute via control
      el.muted = true;
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

      // Begin playback
      el.play().catch(() => {/* ignore */});

      return () => {
        el.removeEventListener('loadedmetadata', onLoadedMetadata as any);
      };
    }

    // Cleanup timeout on unmount
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isOpen, startTime]);

  // TikTok-like tap-to-toggle with debounce guard to prevent double-trigger
  // iOS fullscreen: Use custom modal (not requestFullscreen) to avoid native control conflicts
  const handleVideoToggle = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Guard against rapid re-trigger (250ms debounce)
    const now = Date.now();
    if (now - lastToggleTimeRef.current < 250) {
      return;
    }
    lastToggleTimeRef.current = now;
    
    // Prevent double-trigger if already processing
    if (toggleGuardRef.current) {
      return;
    }
    toggleGuardRef.current = true;
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    
    // Release guard after a short delay
    setTimeout(() => {
      toggleGuardRef.current = false;
    }, 250);
  };

  const handleMuteToggle = () => {
    const el = videoRef.current;
    if (!el) return;
    const willBeMuted = !isMuted;
    el.muted = willBeMuted;
    setIsMuted(willBeMuted);
    if (!willBeMuted) {
      try {
        el.volume = 1.0;
        if (el.paused) {
          el.play().catch(() => {});
        } else {
          el.currentTime = el.currentTime;
          el.play().catch(() => {});
        }
      } catch {}
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

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
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
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    >
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
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

      {/* Video Container */}
      {/* iOS fullscreen modal: Custom overlay (inset:0; height:100dvh) instead of requestFullscreen */}
      {/* This avoids conflicts with native iOS fullscreen controls that cause double-toggle */}
      <div 
        className="flex-1 relative flex items-center justify-center"
        style={{ 
          inset: 0, 
          height: '100dvh',
          width: '100vw'
        }}
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
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          preload="auto"
          muted={isMuted}
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
            pointerEvents: 'none', // Video itself is not clickable, overlay handles taps
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            objectFit: isVideoVertical ? 'cover' : 'contain',
          }}
        />

        {/* TikTok-style tap-to-toggle overlay - single event handler prevents double-trigger */}
        {/* When paused: show centered translucent play icon overlay */}
        {/* When playing: overlay fades out */}
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ touchAction: 'manipulation' }}
          onPointerUp={handleVideoToggle}
          onClick={handleVideoToggle}
        >
          {/* Large translucent play icon (TikTok style) - purely visual, no click handler */}
          <div className="pointer-events-none">
            <svg 
              width="80" 
              height="80" 
              viewBox="0 0 24 24" 
              fill="none"
              style={{ 
                filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6))'
              }}
            >
              {/* Semi-transparent circle background */}
              <circle 
                cx="12" 
                cy="12" 
                r="12" 
                fill="rgba(0, 0, 0, 0.5)" 
              />
              {/* White play triangle */}
              <path 
                d="M9 7L17 12L9 17V7Z" 
                fill="white" 
                opacity="0.9"
              />
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

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
        {/* Progress Bar */}
        <div className="relative mb-4">
          <div 
            className="w-full h-1 bg-gray-600 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-red-500 rounded-full relative"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleVideoToggle}
              className="text-white hover:text-gray-300 transition-colors bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full flex items-center justify-center"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button
              onClick={handleMuteToggle}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <button
            onClick={handleExitFullscreen}
            className="text-white hover:text-gray-300 transition-colors bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full flex items-center justify-center z-20"
          >
            <Minimize2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
} 