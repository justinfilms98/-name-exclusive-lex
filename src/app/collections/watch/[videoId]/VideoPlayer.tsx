"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface VideoPlayerProps {
  src: string;
  title: string;
  expiresAt?: string; // Optional for backward compatibility
}

export default function VideoPlayer({ src, title, expiresAt }: VideoPlayerProps) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Video loading timeout
  useEffect(() => {
    if (src && !videoLoaded) {
      const timeout = setTimeout(() => {
        console.log('Video loading timeout - forcing load state');
        setVideoLoaded(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [src, videoLoaded]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle video events
  const handleVideoLoad = () => {
    console.log('Video loaded successfully');
    setVideoLoaded(true);
  };

  const handleVideoError = (e: any) => {
    console.error('Video loading error:', e);
    setError('Failed to load video content. Please try refreshing the page.');
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        // Try to request fullscreen on the container
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        } else {
          console.error('Fullscreen API not supported');
        }
      } else {
        // Exit fullscreen
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
      // Fallback: try to request fullscreen on the video element itself
      if (videoRef.current) {
        try {
          if (!document.fullscreenElement) {
            if (videoRef.current.requestFullscreen) {
              await videoRef.current.requestFullscreen();
            } else if ((videoRef.current as any).webkitRequestFullscreen) {
              await (videoRef.current as any).webkitRequestFullscreen();
            } else if ((videoRef.current as any).msRequestFullscreen) {
              await (videoRef.current as any).msRequestFullscreen();
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
        } catch (fallbackErr) {
          console.error('Fallback fullscreen error:', fallbackErr);
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
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
      {/* Header for permanent access */}
      <div className="bg-black bg-opacity-75 text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
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
        >
          <video
            ref={videoRef}
            src={src}
            className="w-full h-screen object-contain"
            onContextMenu={(e) => e.preventDefault()}
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            preload="metadata"
            autoPlay
            muted
            playsInline
            controls={false}
            style={{
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              userSelect: 'none',
            }}
          >
            Your browser does not support the video tag.
          </video>

          {/* Loading overlay */}
          {!videoLoaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
              <div className="text-center text-white">
                <div className="text-red-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <p className="text-lg mb-2">Video Loading Error</p>
                <p className="text-sm text-gray-300 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}

          {/* Fullscreen Button */}
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={toggleFullscreen}
              className="bg-black bg-opacity-75 text-white p-3 rounded-lg hover:bg-opacity-90 transition-all duration-200 flex items-center space-x-2"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                  </svg>
                  <span className="text-sm">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                  <span className="text-sm">Fullscreen</span>
                </>
              )}
            </button>
          </div>

          {/* Watermark */}
          <div className="absolute bottom-4 left-4 z-20">
            <div className="text-white text-opacity-50 text-sm bg-black bg-opacity-75 px-3 py-2 rounded-lg">
              {user?.email} • Exclusive Access
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mt-4 text-center">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
      </div>
    </div>
  );
} 