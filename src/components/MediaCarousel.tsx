"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MobileFullscreenVideo from './MobileFullscreenVideo';

interface MediaItem {
  id: string;
  type: 'video' | 'photo';
  url: string;
  title?: string;
  description?: string;
}

interface MediaCarouselProps {
  items: MediaItem[];
  initialIndex?: number;
  onClose?: () => void;
  title?: string;
  mode?: 'modal' | 'inline';
  className?: string;
}

export default function MediaCarousel({ 
  items, 
  initialIndex = 0, 
  onClose, 
  title, 
  mode = 'modal',
  className = ''
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [isVerticalVideo, setIsVerticalVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showMobileFullscreen, setShowMobileFullscreen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentItem = items[currentIndex];

  useEffect(() => {
    // Get current user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentItem?.type === 'video' && videoRef.current) {
      setVideoLoaded(false);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setVideoDimensions({ width: 0, height: 0 });
      setIsVerticalVideo(false);
    }
  }, [currentIndex, currentItem]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement
      );
      
      setIsFullscreen(isInFullscreen);
      
      // If we're not in fullscreen and mobile fullscreen is open, close it
      if (!isInFullscreen && showMobileFullscreen) {
        setShowMobileFullscreen(false);
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
  }, [showMobileFullscreen]);

  // Dev tools detection and prevention
  useEffect(() => {
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        console.warn('Dev tools detected - video playback may be restricted');
        // Optionally redirect or show warning
        // For now, just log a warning
      }
    };

    // Check on load and resize
    detectDevTools();
    window.addEventListener('resize', detectDevTools);
    
    // Check periodically
    const interval = setInterval(detectDevTools, 1000);
    
    return () => {
      window.removeEventListener('resize', detectDevTools);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isMobileViewport = window.innerWidth <= 768;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      setIsMobile(isMobileDevice || isMobileViewport || isIOS);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup mobile fullscreen on unmount or navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (showMobileFullscreen) {
        setShowMobileFullscreen(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (showMobileFullscreen) {
        setShowMobileFullscreen(false);
      }
    };
  }, [showMobileFullscreen]);

  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevItem = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const toggleFullscreen = async () => {
    try {
      if (isMobile) {
        // Use native video fullscreen for mobile (better for iPhone)
        if (videoRef.current) {
          if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
            // Request fullscreen on the video element
            if (videoRef.current.requestFullscreen) {
              await videoRef.current.requestFullscreen();
            } else if ((videoRef.current as any).webkitRequestFullscreen) {
              await (videoRef.current as any).webkitRequestFullscreen();
            } else if ((videoRef.current as any).mozRequestFullScreen) {
              await (videoRef.current as any).mozRequestFullScreen();
            } else if ((videoRef.current as any).msRequestFullscreen) {
              await (videoRef.current as any).msRequestFullscreen();
            } else {
              // Fallback to custom fullscreen if native not supported
              setShowMobileFullscreen(true);
            }
          } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
              await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
              await (document as any).webkitExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
              await (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
              await (document as any).msExitFullscreen();
            }
          }
        }
        return;
      }

      if (!document.fullscreenElement) {
        // Try to make video fullscreen first (better for mobile)
        if (videoRef.current && videoRef.current.requestFullscreen) {
          await videoRef.current.requestFullscreen();
        } else if (videoRef.current && (videoRef.current as any).webkitRequestFullscreen) {
          await (videoRef.current as any).webkitRequestFullscreen();
        } else if (videoRef.current && (videoRef.current as any).msRequestFullscreen) {
          await (videoRef.current as any).msRequestFullscreen();
        } else if (containerRef.current && containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (containerRef.current && (containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if (containerRef.current && (containerRef.current as any).msRequestFullscreen) {
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
      // Fallback: try to close mobile fullscreen if it's open
      if (showMobileFullscreen) {
        setShowMobileFullscreen(false);
      }
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
      const video = videoRef.current;
      setDuration(video.duration);
      setVideoLoaded(true);
      
      // Detect video dimensions and orientation
      const width = video.videoWidth;
      const height = video.videoHeight;
      setVideoDimensions({ width, height });
      setIsVerticalVideo(height > width);
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
      // Only hide controls if video is playing
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        prevItem();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextItem();
        break;
      case 'Escape':
        e.preventDefault();
        if (isFullscreen) {
          toggleFullscreen();
        } else if (onClose) {
          onClose();
        }
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
      case ' ':
          e.preventDefault();
        if (currentItem?.type === 'video') {
          handleVideoClick();
        }
        break;
    }
  };

  if (!currentItem) return null;

  const isModal = mode === 'modal';
  const containerClasses = isModal 
    ? `fixed inset-0 bg-black z-50 ${isFullscreen ? 'fullscreen' : ''} ${isVerticalVideo ? 'vertical-video-container' : ''} ${isMobile && isVerticalVideo ? 'mobile-vertical-video' : ''}`
    : `relative bg-black ${className} ${isVerticalVideo ? 'vertical-video-container' : ''} ${isMobile && isVerticalVideo ? 'mobile-vertical-video' : ''}`;

  return (
    <div 
      ref={containerRef}
      className={containerClasses}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }}
    >
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 ${showControls ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
        <div className="flex items-center justify-between text-white">
          <div>
            <h1 className="text-lg font-semibold">{title || currentItem.title}</h1>
            <p className="text-sm text-gray-300">
              {currentIndex + 1} of {items.length} • {currentItem.type === 'video' ? 'Video' : 'Photo'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {onClose && isModal && (
            <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Close (ESC)"
            >
                <X size={20} />
            </button>
          )}
          </div>
        </div>
        </div>

      {/* Main Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Navigation Arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={prevItem}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors text-white"
              title="Previous (←)"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextItem}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors text-white"
              title="Next (→)"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Media Content */}
        <div className={`relative w-full h-full flex items-center justify-center ${
          isVerticalVideo && isMobile ? 'vertical-video-container mobile-vertical-video' : ''
        }`}>
          {currentItem.type === 'video' ? (
            <div className={`relative w-full h-full ${isVerticalVideo ? 'vertical-video-container' : ''}`}>
              <video
                ref={videoRef}
                src={currentItem.url}
                className={`w-full h-full ${
                  isVerticalVideo 
                    ? 'object-cover' // Fill entire screen for vertical videos (mobile-friendly)
                    : isFullscreen 
                      ? 'object-contain' // Maintain aspect ratio for horizontal videos in fullscreen
                      : 'object-contain' // Maintain aspect ratio for horizontal videos in normal mode
                }`}
                onContextMenu={(e) => e.preventDefault()}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={() => setVideoLoaded(true)}
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
                  // Ensure vertical videos fill the entire screen on mobile
                  ...(isVerticalVideo && {
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%',
                    ...(isMobile && {
                      width: '100vw',
                      height: '100vh',
                      maxWidth: '100vw',
                      maxHeight: '100vh',
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      bottom: '0',
                      WebkitObjectFit: 'cover',
                      WebkitTransform: 'translateZ(0)',
                      transform: 'translateZ(0)',
                    }),
                  }),
                }}
              />
              
              {/* Secure Watermark */}
              <div className="absolute bottom-4 right-4 text-xs opacity-30 pointer-events-none select-none z-50 text-white bg-black bg-opacity-20 px-2 py-1 rounded">
                ExclusiveLex • {user?.email || 'Guest'}
              </div>
              
              {/* Play Button Overlay */}
              {(!isPlaying || currentTime === 0) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <button
                    onClick={handleVideoClick}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-6 rounded-full transition-all duration-300 backdrop-blur-sm hover:scale-110"
                  >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Video Controls */}
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 ${(showControls || !isPlaying) ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                {/* Progress Bar with Play Button */}
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
                  
                  {/* Play Button on Timeline */}
                  {(!isPlaying || currentTime === 0) && (
                    <button
                      onClick={handleVideoClick}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-black p-2 rounded-full transition-all duration-300 shadow-lg hover:scale-110 z-10"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleVideoClick}
                      className="text-white hover:text-gray-300 transition-colors bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full flex items-center justify-center"
                    >
                      {isPlaying ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      )}
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

                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-gray-300 transition-colors bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full flex items-center justify-center"
                    title="Toggle Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={currentItem.url}
              alt={currentItem.title || `Photo ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
        </div>
      </div>

      {/* Dots Indicator */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Mobile Fullscreen Video Player */}
      {currentItem?.type === 'video' && (
        <MobileFullscreenVideo
          videoUrl={currentItem.url}
          isOpen={showMobileFullscreen}
          onClose={() => setShowMobileFullscreen(false)}
          title={currentItem.title || title}
          isVertical={isVerticalVideo}
        />
      )}
    </div>
  );
} 