"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface VideoDetails {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  purchasedAt: string;
  expiresAt: string;
  category?: string;
  tags?: string[];
}

interface SuggestedVideo {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  price: number;
}

export default function WatchPage({ params }: { params: { videoId: string } }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [suggestedVideos, setSuggestedVideos] = useState<SuggestedVideo[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [showProgressTooltip, setShowProgressTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const [tooltipTime, setTooltipTime] = useState('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/signin');
        return;
      }

      setUserEmail(user.email || '');
      await fetchVideoAccess();
      await fetchSuggestedVideos();
    } catch (err) {
      console.error('Auth check failed:', err);
      router.push('/signin');
    }
  };

  useEffect(() => {
    if (videoDetails?.expiresAt) {
      const timer = setInterval(updateTimeRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, [videoDetails]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (isPlaying) {
            videoRef.current.pause();
          } else {
            videoRef.current.play();
          }
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setVolume(videoRef.current.muted ? 0 : 1);
          }
          break;
        case 'arrowright':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime += 10;
          }
          break;
        case 'arrowleft':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime -= 10;
          }
          break;
        case 'arrowup':
          e.preventDefault();
          if (videoRef.current) {
            const newVolume = Math.min(1, videoRef.current.volume + 0.1);
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
          }
          break;
        case 'arrowdown':
          e.preventDefault();
          if (videoRef.current) {
            const newVolume = Math.max(0, videoRef.current.volume - 0.1);
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
          }
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardShortcuts(true);
          break;
      }
    };

    // Disable right-click and developer tools
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, toggleFullscreen]);

  const fetchSuggestedVideos = async () => {
    try {
      const res = await fetch('/api/collection-videos');
      if (!res.ok) throw new Error('Failed to fetch suggested videos');
      const data = await res.json();
      // Filter out current video and get 3 random suggestions
      const filtered = data.filter((v: any) => v.id !== parseInt(params.videoId));
      const shuffled = filtered.sort(() => 0.5 - Math.random());
      setSuggestedVideos(shuffled.slice(0, 3));
    } catch (err) {
      console.error('Failed to fetch suggested videos:', err);
    }
  };

  const updateTimeRemaining = () => {
    if (!videoDetails?.expiresAt) return;
    
    const now = new Date();
    const expires = new Date(videoDetails.expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) {
      setTimeRemaining('Expired');
      if (videoRef.current) {
        videoRef.current.pause();
      }
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleMouseMove = () => {
    setLastInteraction(Date.now());
    setShowControls(true);
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const fetchVideoAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get signed video URL
      const response = await fetch('/api/video-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: parseInt(params.videoId) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get video access');
      }

      const { signedUrl } = await response.json();
      setVideoUrl(signedUrl);

      // Fetch video details
      const detailsResponse = await fetch(`/api/collection-videos/${params.videoId}`);
      if (detailsResponse.ok) {
        const videoData = await detailsResponse.json();
        setVideoDetails({
          ...videoData,
          purchasedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });
      }
    } catch (err) {
      console.error('Error fetching video access:', err);
      setError(err instanceof Error ? err.message : 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setTooltipPosition(percentage);
    setTooltipTime(formatTime(percentage * (videoRef.current?.duration || 0)));
    setShowProgressTooltip(true);
  };

  const handleProgressLeave = () => {
    setShowProgressTooltip(false);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    videoRef.current.currentTime = percentage * videoRef.current.duration;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center max-w-md mx-auto p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link
            href="/collections"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse Videos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Video Player Container */}
      <div className="relative w-full h-screen">
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl || ''}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsBuffering(true)}
          onCanPlay={() => setIsBuffering(false)}
          onMouseMove={handleMouseMove}
          onDoubleClick={toggleFullscreen}
        />

        {/* Watermark */}
        <div className="absolute top-4 right-4 text-white text-sm opacity-50 pointer-events-none">
          {userEmail}
        </div>

        {/* Loading Overlay */}
        {isBuffering && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading...</p>
            </div>
          </div>
        )}

        {/* Video Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6"
            >
              {/* Progress Bar */}
              <div className="relative mb-4">
                <div
                  className="w-full h-1 bg-gray-600 rounded cursor-pointer relative"
                  onClick={handleProgressClick}
                  onMouseMove={handleProgressHover}
                  onMouseLeave={handleProgressLeave}
                >
                  <div
                    className="h-full bg-purple-600 rounded"
                    style={{
                      width: `${(currentTime / (videoRef.current?.duration || 1)) * 100}%`,
                    }}
                  />
                  {showProgressTooltip && (
                    <div
                      className="absolute top-[-30px] transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs"
                      style={{ left: `${tooltipPosition * 100}%` }}
                    >
                      {tooltipTime}
                    </div>
                  )}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) {
                          videoRef.current.pause();
                        } else {
                          videoRef.current.play();
                        }
                      }
                    }}
                    className="text-white hover:text-purple-400 transition-colors"
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                      className="text-white hover:text-purple-400 transition-colors"
                    >
                      🔊
                    </button>
                    {showVolumeSlider && (
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20"
                      />
                    )}
                  </div>

                  <span className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(videoRef.current?.duration || 0)}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-purple-400 transition-colors"
                  >
                    ⛶
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Time Remaining */}
        {timeRemaining && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
            Expires in: {timeRemaining}
          </div>
        )}
      </div>

      {/* Video Details */}
      {videoDetails && (
        <div className="bg-gray-900 text-white p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">{videoDetails.title}</h1>
            <p className="text-gray-300 mb-4">{videoDetails.description}</p>
            
            {/* Suggested Videos */}
            {suggestedVideos.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">You might also like</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {suggestedVideos.map((video) => (
                    <Link
                      key={video.id}
                      href={`/watch/${video.id}`}
                      className="block bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
                    >
                      <div className="relative h-32">
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1">{video.title}</h3>
                        <p className="text-sm text-gray-400 mb-2">{video.description}</p>
                        <p className="text-purple-400 font-semibold">${video.price}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showKeyboardShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setShowKeyboardShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-gray-800 text-white p-6 rounded-lg max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Space / K</span>
                  <span>Play/Pause</span>
                </div>
                <div className="flex justify-between">
                  <span>F</span>
                  <span>Fullscreen</span>
                </div>
                <div className="flex justify-between">
                  <span>M</span>
                  <span>Mute</span>
                </div>
                <div className="flex justify-between">
                  <span>← →</span>
                  <span>Seek 10s</span>
                </div>
                <div className="flex justify-between">
                  <span>↑ ↓</span>
                  <span>Volume</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 