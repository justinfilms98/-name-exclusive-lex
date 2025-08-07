"use client";

import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileFullscreenVideoProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  isVertical?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
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
  hasPrevious = false
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

  useEffect(() => {
    if (isOpen && videoRef.current) {
      // Auto-play when opened
      videoRef.current.play().catch(console.error);
      // Auto-request fullscreen for iOS
      requestFullscreen();
    }

    // Cleanup timeout on unmount
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!(document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement);
      
      setIsFullscreen(isFullscreenNow);
      
      if (!isFullscreenNow) {
        onClose();
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
  }, [onClose]);

  const requestFullscreen = async () => {
    if (!videoRef.current) return;

    try {
      // For iOS, we need to use the video element's requestFullscreen
      if (videoRef.current.requestFullscreen) {
        await videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        await (videoRef.current as any).webkitRequestFullscreen();
      } else if ((videoRef.current as any).mozRequestFullScreen) {
        await (videoRef.current as any).mozRequestFullScreen();
      } else if ((videoRef.current as any).msRequestFullscreen) {
        await (videoRef.current as any).msRequestFullscreen();
      } else {
        console.log('Native fullscreen not supported, using fallback');
        // Fallback: try to make the video element fullscreen
        onClose();
      }
    } catch (err) {
      console.error('Fullscreen request error:', err);
      onClose();
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

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
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

  const handleExitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (err) {
      console.error('Exit fullscreen error:', err);
    }
    onClose();
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
      <div className="flex-1 relative flex items-center justify-center">
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
          preload="metadata"
          muted={isMuted}
          playsInline
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          style={{
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none',
            pointerEvents: 'auto',
            ...(isVideoVertical && {
              objectFit: 'cover',
              width: '100vw',
              height: '100vh',
              maxWidth: '100vw',
              maxHeight: '100vh',
            }),
          }}
        />

        {/* Play Button Overlay */}
        {(!isPlaying || currentTime === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <button
              onClick={handleVideoClick}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-6 rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110"
            >
              <Play size={48} />
            </button>
          </div>
        )}

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
              onClick={handleVideoClick}
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