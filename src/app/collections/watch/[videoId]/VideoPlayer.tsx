"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface VideoPlayerProps {
  src: string;
  title: string;
  expiresAt?: string;
}

export default function VideoPlayer({ src, title, expiresAt }: VideoPlayerProps) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft(0);
        router.push("/collections");
      } else {
        setTimeLeft(Math.ceil(ms / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, router]);

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

  // Handle video events
  const handleVideoLoad = () => {
    console.log('Video loaded successfully');
    setVideoLoaded(true);
  };

  const handleVideoError = (e: any) => {
    console.error('Video loading error:', e);
    setError('Failed to load video content. Please try refreshing the page.');
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

  const formatTimeLeft = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}` : `${minutes}:${secs.toString().padStart(2, "0")}`;
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
    <div className="min-h-screen bg-black">
      {/* Header with timer */}
      {timeLeft !== null && timeLeft > 0 && (
        <div className="bg-black bg-opacity-75 text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-sm text-gray-300">Exclusive Content</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300">Time Remaining</p>
            <p className="text-lg font-mono text-red-400">{formatTimeLeft(timeLeft)}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={timeLeft !== null && timeLeft > 0 ? "pt-20" : ""}>
        {/* Video Player */}
        <div 
          className="relative bg-black"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            if (isPlaying) {
              setShowControls(false);
            }
          }}
        >
          <video
            ref={videoRef}
            src={src}
            className="w-full h-screen object-contain"
            onContextMenu={(e) => e.preventDefault()}
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
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

                {/* Time Display */}
                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Watermark */}
              <div className="text-white text-opacity-50 text-sm">
                {user?.email} • Exclusive Access
              </div>
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