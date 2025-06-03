"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams ? searchParams.get('userId') : null;
  if (!userId) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Missing user ID. Please access this page from your account.</div>;
  }
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
      return;
    }

    if (status === 'authenticated' && session?.user?.email) {
      fetchVideoAccess();
      fetchSuggestedVideos();
    }
  }, [status, session, router]);

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

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
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
      // Fetch video details and access
      const res = await fetch(`/api/secure-video?videoId=${params.videoId}&userId=${userId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to access video');
      }

      setVideoDetails({
        id: data.video.id,
        title: data.video.title,
        description: data.video.description,
        thumbnail: data.video.thumbnail,
        duration: data.video.duration,
        purchasedAt: data.purchase.purchased_at,
        expiresAt: data.purchase.expires_at
      });
      
      setVideoUrl(data.signedUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setTooltipPosition(pos * 100);
    setTooltipTime(formatTime(pos * (videoRef.current?.duration || 0)));
    setShowProgressTooltip(true);
  };

  const handleProgressLeave = () => {
    setShowProgressTooltip(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4C7B4]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#654C37] mb-4"></div>
          <p className="text-[#654C37]">Loading your video...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D4C7B4] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#654C37] mb-2">Access Denied</h2>
          <p className="text-[#654C37]/80 mb-4">{error}</p>
          <button
            onClick={() => router.push('/collections')}
            className="bg-[#654C37] text-white px-6 py-2 rounded-lg hover:bg-[#654C37]/90 transition-colors"
          >
            Browse Collections
          </button>
        </motion.div>
      </div>
    );
  }

  if (!videoDetails || !videoUrl) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#D4C7B4] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {/* Enhanced Video Player */}
          <div 
            className="relative aspect-video bg-black group"
            onMouseMove={() => {
              setLastInteraction(Date.now());
              handleMouseMove();
            }}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              poster={videoDetails.thumbnail}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onClick={() => {
                if (videoRef.current) {
                  if (isPlaying) {
                    videoRef.current.pause();
                  } else {
                    videoRef.current.play();
                  }
                }
              }}
            />
            
            {/* Buffering Indicator */}
            <AnimatePresence>
              {isBuffering && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50"
                >
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Custom Video Controls */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
                >
                  <div className="flex flex-col gap-2">
                    {/* Progress Bar */}
                    <div 
                      className="relative h-1 group/progress"
                      onMouseMove={handleProgressHover}
                      onMouseLeave={handleProgressLeave}
                    >
                      <div className="absolute inset-0 bg-[#D4C7B4]/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#654C37] rounded-full"
                          style={{ width: `${(currentTime / (videoRef.current?.duration || 1)) * 100}%` }}
                        />
                      </div>
                      {showProgressTooltip && (
                        <div 
                          className="absolute bottom-full mb-2 transform -translate-x-1/2 bg-black/90 text-white px-2 py-1 rounded text-sm whitespace-nowrap"
                          style={{ left: `${tooltipPosition}%` }}
                        >
                          {tooltipTime}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
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
                          className="text-white hover:text-[#D4C7B4] transition-colors"
                        >
                          {isPlaying ? (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        
                        <div className="text-white text-sm">
                          {formatTime(currentTime)} / {formatTime(videoRef.current?.duration || 0)}
                        </div>
                      </div>

                      <div className="flex-1" />

                      <div className="flex items-center gap-2">
                        <div className="relative group/volume">
                          <button
                            onClick={() => {
                              if (videoRef.current) {
                                videoRef.current.muted = !videoRef.current.muted;
                                setVolume(videoRef.current.muted ? 0 : 1);
                              }
                            }}
                            onMouseEnter={() => setShowVolumeSlider(true)}
                            className="text-white hover:text-[#D4C7B4] transition-colors"
                          >
                            {volume === 0 ? (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                              </svg>
                            ) : volume < 0.5 ? (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                            )}
                          </button>
                          <AnimatePresence>
                            {showVolumeSlider && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onMouseEnter={() => setShowVolumeSlider(true)}
                                onMouseLeave={() => setShowVolumeSlider(false)}
                                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 p-2 rounded-lg"
                              >
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={volume}
                                  onChange={handleVolumeChange}
                                  className="w-24 h-1 bg-[#D4C7B4]/30 rounded-full appearance-none cursor-pointer rotate-180"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <button
                          onClick={() => setShowKeyboardShortcuts(true)}
                          className="text-white hover:text-[#D4C7B4] transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </button>

                        <button
                          onClick={toggleFullscreen}
                          className="text-white hover:text-[#D4C7B4] transition-colors"
                        >
                          {isFullscreen ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M15 9h4.5M15 9V4.5M15 15v4.5M15 15h4.5M9 15H4.5M9 15v4.5" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Keyboard Shortcuts Modal */}
            <AnimatePresence>
              {showKeyboardShortcuts && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
                  onClick={() => setShowKeyboardShortcuts(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
                    onClick={e => e.stopPropagation()}
                  >
                    <h3 className="text-xl font-bold text-[#654C37] mb-4">Keyboard Shortcuts</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[#654C37] font-medium">Space / K</p>
                        <p className="text-[#654C37]/80">Play/Pause</p>
                      </div>
                      <div>
                        <p className="text-[#654C37] font-medium">F</p>
                        <p className="text-[#654C37]/80">Fullscreen</p>
                      </div>
                      <div>
                        <p className="text-[#654C37] font-medium">M</p>
                        <p className="text-[#654C37]/80">Mute</p>
                      </div>
                      <div>
                        <p className="text-[#654C37] font-medium">← / →</p>
                        <p className="text-[#654C37]/80">Seek 10s</p>
                      </div>
                      <div>
                        <p className="text-[#654C37] font-medium">↑ / ↓</p>
                        <p className="text-[#654C37]/80">Volume</p>
                      </div>
                      <div>
                        <p className="text-[#654C37] font-medium">?</p>
                        <p className="text-[#654C37]/80">Show Shortcuts</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowKeyboardShortcuts(false)}
                      className="mt-6 w-full bg-[#654C37] text-white py-2 rounded-lg hover:bg-[#654C37]/90 transition-colors"
                    >
                      Close
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Video Info */}
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[#654C37] mb-2">{videoDetails.title}</h1>
                <p className="text-[#654C37]/80">{videoDetails.description}</p>
              </div>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-[#D4C7B4] px-4 py-2 rounded-lg text-[#654C37] font-medium"
              >
                Time Remaining: {timeRemaining}
              </motion.div>
            </div>

            {!videoDetails.expiresAt || !videoDetails.purchasedAt || !videoDetails.duration ? (
              <div className="bg-red-100 text-red-700 rounded p-4 my-4">
                Video access information is missing or incomplete. Please contact support.
              </div>
            ) : (
              <div className="border-t border-[#654C37]/10 pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-[#654C37]/60">
                  <div>
                    <p className="font-medium">Duration</p>
                    <p>{videoDetails.duration} minutes</p>
                  </div>
                  <div>
                    <p className="font-medium">Purchased</p>
                    <p>{new Date(videoDetails.purchasedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Expires</p>
                    <p>{new Date(videoDetails.expiresAt).toLocaleDateString()}</p>
                  </div>
                  {videoDetails.category && (
                    <div>
                      <p className="font-medium">Category</p>
                      <p>{videoDetails.category}</p>
                    </div>
                  )}
                </div>
                {videoDetails.tags && videoDetails.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {videoDetails.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-[#D4C7B4]/30 text-[#654C37] px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Suggested Videos */}
        {suggestedVideos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-bold text-[#654C37] mb-4">More Videos You Might Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedVideos.map((video) => (
                <motion.div
                  key={video.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                  <Link href={`/watch/${video.id}`}>
                    <div className="relative aspect-video">
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-sm">
                          {video.duration} min
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-[#654C37] mb-2">{video.title}</h3>
                      <p className="text-[#654C37]/80 text-sm line-clamp-2 mb-2">{video.description}</p>
                      <p className="text-[#C9BBA8] font-bold">${video.price.toFixed(2)}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 