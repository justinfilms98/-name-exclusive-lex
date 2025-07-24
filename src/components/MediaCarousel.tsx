"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2 } from 'lucide-react';
import { getSignedUrl } from '@/lib/supabase';

interface MediaItem {
  id: string;
  type: 'video' | 'image';
  path: string;
  signedUrl?: string;
}

interface MediaCarouselProps {
  videoPath: string;
  photoPaths: string[];
  onPlay?: () => void;
  onPause?: () => void;
}

export default function MediaCarousel({ videoPath, photoPaths, onPlay, onPause }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenMedia, setFullscreenMedia] = useState<MediaItem | null>(null);
  const [showMobileHint, setShowMobileHint] = useState(false);

  useEffect(() => {
    const loadMedia = async () => {
      console.log('MediaCarousel: Loading media');
      console.log('Video path:', videoPath);
      console.log('Photo paths:', photoPaths);
      console.log('Photo paths length:', photoPaths.length);
      
      const items: MediaItem[] = [];
      
      // Add video as first item
      if (videoPath) {
        console.log('Loading video signed URL...');
        const { data: signedUrl } = await getSignedUrl('media', videoPath);
        console.log('Video signed URL:', signedUrl?.signedUrl);
        items.push({
          id: 'video',
          type: 'video',
          path: videoPath,
          signedUrl: signedUrl?.signedUrl
        });
      }

      // Add photos
      console.log('Loading photos...');
      for (let i = 0; i < photoPaths.length; i++) {
        console.log(`Loading photo ${i + 1}:`, photoPaths[i]);
        const { data: signedUrl } = await getSignedUrl('media', photoPaths[i]);
        console.log(`Photo ${i + 1} signed URL:`, signedUrl?.signedUrl);
        items.push({
          id: `photo-${i}`,
          type: 'image',
          path: photoPaths[i],
          signedUrl: signedUrl?.signedUrl
        });
      }

      console.log('Final media items:', items);
      setMediaItems(items);
      setLoading(false);
    };

    loadMedia();

    // Check if mobile and show hint
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      setShowMobileHint(true);
      // Hide hint after 5 seconds
      setTimeout(() => setShowMobileHint(false), 5000);
      
      // Test fullscreen support
      console.log('📱 Mobile device detected');
      console.log('🔍 Fullscreen support test:');
      console.log('- document.fullscreenEnabled:', document.fullscreenEnabled);
      console.log('- document.webkitFullscreenEnabled:', (document as any).webkitFullscreenEnabled);
      console.log('- document.msFullscreenEnabled:', (document as any).msFullscreenEnabled);
      console.log('- User agent:', navigator.userAgent);
    }

    // Add screenshot protection
    const blurMedia = () => {
      const container = document.querySelector('.video-container') as HTMLElement;
      if (container) {
        container.style.filter = 'blur(20px)';
        container.style.transition = 'filter 0.3s ease';
        
        // Show warning
        const warning = document.createElement('div');
        warning.className = 'fixed inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-50';
        warning.innerHTML = `
          <div class="text-center text-white p-8">
            <h2 class="text-2xl font-bold mb-4">⚠️ SCREENSHOT DETECTED</h2>
            <p class="text-lg">Screenshot attempts are not allowed for this private content.</p>
            <p class="text-sm mt-2">Content has been blurred for security.</p>
          </div>
        `;
        document.body.appendChild(warning);
        
        // Remove warning after 5 seconds
        setTimeout(() => {
          if (warning.parentNode) {
            warning.parentNode.removeChild(warning);
          }
        }, 5000);
        
        // Unblur after 10 seconds
        setTimeout(() => {
          if (container) {
            container.style.filter = 'none';
          }
        }, 10000);
      }
    };

    // Screenshot detection
    const detectScreenshotAttempts = () => {
      let screenshotAttempts = 0;
      let lastAttemptTime = 0;
      
      const handleScreenshotAttempt = () => {
        const now = Date.now();
        if (now - lastAttemptTime < 1000) {
          screenshotAttempts++;
        } else {
          screenshotAttempts = 1;
        }
        lastAttemptTime = now;
        
        if (screenshotAttempts >= 2) {
          blurMedia();
          screenshotAttempts = 0;
        }
      };

      // Monitor for screenshot triggers
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.key === 'PrintScreen' ||
          (e.ctrlKey && e.key === 's') ||
          (e.ctrlKey && e.key === 'p') ||
          (e.metaKey && e.key === 's') ||
          (e.metaKey && e.key === 'p') ||
          e.key === 'F12' ||
          e.key === 'F11'
        ) {
          e.preventDefault();
          handleScreenshotAttempt();
        }
      };

      // Monitor window focus/blur
      let focusTimeout: NodeJS.Timeout;
      const handleBlur = () => {
        focusTimeout = setTimeout(() => {
          handleScreenshotAttempt();
        }, 100);
      };

      const handleFocus = () => {
        if (focusTimeout) {
          clearTimeout(focusTimeout);
        }
      };

      // Monitor for clipboard operations
      const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault();
        handleScreenshotAttempt();
      };

      const handleCut = (e: ClipboardEvent) => {
        e.preventDefault();
        handleScreenshotAttempt();
      };

      // Monitor for context menu
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        handleScreenshotAttempt();
      };

      // Monitor for selection
      const handleSelectStart = (e: Event) => {
        e.preventDefault();
        handleScreenshotAttempt();
      };

      // Monitor for drag operations
      const handleDragStart = (e: DragEvent) => {
        e.preventDefault();
        handleScreenshotAttempt();
      };

      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
      document.addEventListener('copy', handleCopy);
      document.addEventListener('cut', handleCut);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('selectstart', handleSelectStart);
      document.addEventListener('dragstart', handleDragStart);

      // Cleanup function
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('cut', handleCut);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('selectstart', handleSelectStart);
        document.removeEventListener('dragstart', handleDragStart);
      };
    };

    const cleanup = detectScreenshotAttempts();
    return cleanup;
  }, [videoPath, photoPaths]);

  const nextSlide = () => {
    console.log('Next slide clicked, current index:', currentIndex, 'total items:', mediaItems.length);
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = () => {
    console.log('Previous slide clicked, current index:', currentIndex, 'total items:', mediaItems.length);
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handlePlayPause = () => {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video) {
      if (video.paused) {
        // Enable audio on first user interaction
        video.muted = false;
        setIsMuted(false);
        video.play();
        setIsPlaying(true);
        onPlay?.();
      } else {
        video.pause();
        setIsPlaying(false);
        onPause?.();
      }
    }
  };

  // Auto-unmute on first user interaction
  const handleVideoInteraction = () => {
    if (isMuted) {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        video.muted = false;
        setIsMuted(false);
      }
    }
  };

  const openFullscreen = (mediaItem: MediaItem) => {
    // Check if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('🔍 DEBUG: openFullscreen called, mediaItem:', mediaItem.type, 'isMobile:', isMobile);
    
    if (mediaItem.type === 'video') {
      // For videos, use native fullscreen API
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      console.log('🔍 DEBUG: Video element found:', !!videoElement);
      
      if (videoElement) {
        if (isMobile) {
          // On mobile, try to use video element's fullscreen API
          console.log('📱 Attempting mobile video fullscreen...');
          
          // First, ensure video is loaded and ready
          if (videoElement.readyState >= 2) {
            console.log('✅ Video is ready, attempting fullscreen...');
            
            // Try standard fullscreen first
            if (videoElement.requestFullscreen) {
              console.log('🔄 Trying standard fullscreen...');
              videoElement.requestFullscreen().then(() => {
                console.log('✅ Standard fullscreen successful!');
              }).catch((err) => {
                console.log('❌ Standard fullscreen failed:', err);
                
                // Try webkit fullscreen
                if ((videoElement as any).webkitRequestFullscreen) {
                  console.log('🔄 Trying webkit fullscreen...');
                  (videoElement as any).webkitRequestFullscreen().then(() => {
                    console.log('✅ Webkit fullscreen successful!');
                  }).catch((webkitErr) => {
                    console.log('❌ Webkit fullscreen failed:', webkitErr);
                    
                    // Try to play video in fullscreen mode as last resort
                    console.log('🔄 Trying to play video...');
                    videoElement.play().then(() => {
                      console.log('✅ Video playing successfully');
                    }).catch((playErr) => {
                      console.log('❌ Video play failed:', playErr);
                      // Last resort: open in new tab
                      console.log('🔄 Opening video in new tab as fallback...');
                      window.open(mediaItem.signedUrl, '_blank');
                    });
                  });
                }
              });
            } else if ((videoElement as any).webkitRequestFullscreen) {
              console.log('🔄 Trying webkit fullscreen directly...');
              (videoElement as any).webkitRequestFullscreen();
            } else if ((videoElement as any).msRequestFullscreen) {
              console.log('🔄 Trying MS fullscreen...');
              (videoElement as any).msRequestFullscreen();
            } else {
              console.log('❌ No fullscreen API available');
            }
          } else {
            console.log('⏳ Video not ready yet, waiting...');
            videoElement.addEventListener('loadeddata', () => {
              console.log('✅ Video loaded, retrying fullscreen...');
              openFullscreen(mediaItem);
            });
          }
        } else {
          // Desktop fullscreen
          console.log('🖥️ Desktop fullscreen...');
          if (videoElement.requestFullscreen) {
            videoElement.requestFullscreen();
          } else if ((videoElement as any).webkitRequestFullscreen) {
            (videoElement as any).webkitRequestFullscreen();
          } else if ((videoElement as any).msRequestFullscreen) {
            (videoElement as any).msRequestFullscreen();
          }
        }
      } else {
        console.log('❌ Video element not found');
      }
    } else {
      // For photos on mobile, use a different approach since mobile browsers don't support image fullscreen well
      if (isMobile) {
        console.log('📱 Mobile photo - using modal fullscreen');
        // Create a modal fullscreen for photos on mobile
        setFullscreenMedia(mediaItem);
        setIsFullscreen(true);
      } else {
        console.log('🖥️ Desktop photo fullscreen...');
        // Desktop photo fullscreen
        const imgElement = document.querySelector('img') as HTMLImageElement;
        if (imgElement) {
          if (imgElement.requestFullscreen) {
            imgElement.requestFullscreen();
          } else if ((imgElement as any).webkitRequestFullscreen) {
            (imgElement as any).webkitRequestFullscreen();
          } else if ((imgElement as any).msRequestFullscreen) {
            (imgElement as any).msRequestFullscreen();
          }
        }
      }
    }
  };

  const closeFullscreen = () => {
    // Check if we're in native fullscreen mode
    if (document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement) {
      // Exit native fullscreen mode
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    } else {
      // Close modal fullscreen
      setFullscreenMedia(null);
      setIsFullscreen(false);
    }
  };

  const handleMediaClick = (mediaItem: MediaItem) => {
    if (mediaItem.type === 'video') {
      handlePlayPause();
    } else {
      openFullscreen(mediaItem);
    }
  };

  const handleMediaDoubleClick = (mediaItem: MediaItem) => {
    openFullscreen(mediaItem);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mediaItems.length <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mediaItems.length]);

  // Fullscreen keyboard support and state tracking
  useEffect(() => {
    const handleFullscreenKeyDown = (e: KeyboardEvent) => {
      if (document.fullscreenElement || fullscreenMedia) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeFullscreen();
        }
      }
    };

    const handleFullscreenChange = () => {
      const isInFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement);
      setIsFullscreen(isInFullscreen);
      if (!isInFullscreen) {
        setFullscreenMedia(null);
      }
    };

    document.addEventListener('keydown', handleFullscreenKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('keydown', handleFullscreenKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [fullscreenMedia]);

  if (loading) {
    return (
      <div className="aspect-video bg-stone-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-stone-300">Loading media...</p>
        </div>
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className="aspect-video bg-stone-700 flex items-center justify-center">
        <p className="text-stone-300">No media available</p>
      </div>
    );
  }

  const currentItem = mediaItems[currentIndex];

  return (
    <div className="relative bg-stone-800 rounded-lg overflow-hidden video-container">
      {/* Media Display */}
      <div className="relative aspect-video">
        {currentItem.type === 'video' ? (
          <video
            className="w-full h-full object-cover cursor-pointer"
            controls={false}
            autoPlay={currentIndex === 0}
            muted={isMuted}
            loop
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={() => handleMediaClick(currentItem)}
            onDoubleClick={() => handleMediaDoubleClick(currentItem)}
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <source src={currentItem.signedUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={currentItem.signedUrl}
            alt="Collection photo"
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => handleMediaClick(currentItem)}
            onDoubleClick={() => handleMediaDoubleClick(currentItem)}
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          />
        )}

        {/* Custom Controls Overlay */}
        <div className="video-overlay flex items-center justify-center">
          {currentItem.type === 'video' && (
            <button
              onClick={handlePlayPause}
              className="bg-black bg-opacity-50 text-white p-4 rounded-full hover:bg-opacity-70 transition-all"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </button>
          )}
        </div>

        {/* Navigation Arrows */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white p-3 rounded-full hover:bg-opacity-90 transition-all z-10 hover:scale-110"
              aria-label="Previous media"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white p-3 rounded-full hover:bg-opacity-90 transition-all z-10 hover:scale-110"
              aria-label="Next media"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {mediaItems.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {mediaItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Media Type Indicator */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {currentItem.type === 'video' ? 'VIDEO' : 'PHOTO'} {currentIndex + 1}/{mediaItems.length}
      </div>

      {/* Fullscreen Button */}
      <button
        onClick={() => handleMediaDoubleClick(currentItem)}
        className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-full hover:bg-opacity-100 transition-all duration-200 z-20 md:p-2"
        title="Fullscreen"
        style={{ 
          minWidth: '44px', 
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Maximize2 className="w-6 h-6 md:w-5 md:h-5" />
      </button>

      {/* Mobile Fullscreen Hint */}
      {showMobileHint && (
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-center text-sm z-30">
          <div className="flex items-center justify-center space-x-2">
            <Maximize2 className="w-4 h-4" />
            <span>Tap the fullscreen button or double-tap media to view fullscreen</span>
          </div>
        </div>
      )}

      {/* Modal Fullscreen for Mobile Photos */}
      {fullscreenMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <div className="relative max-w-full max-h-full p-4">
            {fullscreenMedia.type === 'video' ? (
              <video
                src={fullscreenMedia.signedUrl}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                muted={isMuted}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  userSelect: 'none',
                }}
              />
            ) : (
              <img
                src={fullscreenMedia.signedUrl}
                alt="Fullscreen content"
                className="max-w-full max-h-full object-contain"
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  userSelect: 'none',
                }}
              />
            )}
            
            {/* Close button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-full hover:bg-opacity-100 transition-all duration-200"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
            
            {/* Watermark */}
            <div className="absolute bottom-4 left-4 text-white text-opacity-50 text-sm">
              Exclusive Content
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 