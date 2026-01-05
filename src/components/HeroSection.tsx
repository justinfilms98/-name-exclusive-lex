"use client";

import { useState, useEffect, useRef } from 'react';
import { getHeroVideos, getSignedUrl, supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface HeroVideo {
  id: string;
  title: string;
  subtitle?: string;
  video_path: string;
  media_filename?: string; // ✅ Added for new logic
  order_index: number;
}

export default function HeroSection() {
  const [heroVideos, setHeroVideos] = useState<HeroVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<unknown>(null);
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [videosPlaying, setVideosPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoadTimeout, setVideoLoadTimeout] = useState(false);
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const singleVideoRef = useRef<HTMLVideoElement | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check age verification before loading videos
    if (typeof window !== 'undefined') {
      const verified = localStorage.getItem('exclusivelex_age_verified');
      const isVerified = verified === 'true';
      setAgeVerified(isVerified);
      
      // If already verified, attempt to play video
      if (isVerified) {
        // Small delay to ensure component is mounted
        setTimeout(() => {
          attemptVideoPlay();
        }, 100);
      }
    }
    loadHeroVideos();
    loadUser();
  }, []);

  // Listen for age verification event
  useEffect(() => {
    const handleAgeVerified = () => {
      setAgeVerified(true);
      // Load video URLs if not already loaded
      if (heroVideos.length > 0 && videoUrls.length === 0) {
        loadAllVideoUrls();
      }
    };

    window.addEventListener('exclusivelex:age-verified', handleAgeVerified);
    return () => {
      window.removeEventListener('exclusivelex:age-verified', handleAgeVerified);
    };
  }, [heroVideos.length, videoUrls.length]);

  // Function to attempt video playback (called when age is verified)
  const attemptVideoPlay = () => {
    const v = singleVideoRef.current;
    if (!v || !ageVerified) {
      console.log('Cannot play: video ref missing or age not verified', { v: !!v, ageVerified });
      return;
    }

    if (!videosLoaded || videoUrls.length === 0) {
      console.log('Cannot play: videos not loaded yet', { videosLoaded, videoUrlsLength: videoUrls.length });
      // If videos aren't loaded but we have hero videos, try loading them
      if (heroVideos.length > 0) {
        loadAllVideoUrls();
      }
      return;
    }

    // Ensure video has src set
    const url = videoUrls[currentVideoIndex];
    if (!url) {
      console.log('Cannot play: no URL for current video index', currentVideoIndex);
      return;
    }

    try {
      console.log('Attempting to play video:', url);
      // Ensure video attributes are set
      v.muted = true;
      v.defaultMuted = true;
      (v as HTMLVideoElement & { playsInline?: boolean }).playsInline = true;
      
      // If src is not set or different, set it
      if (!v.src || v.src !== url) {
        v.src = url;
        v.load();
      }
      
      // Try to play
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video playing successfully');
            setAutoplayBlocked(false);
            setVideosPlaying(true);
          })
          .catch((error) => {
            console.log('Autoplay blocked, showing tap-to-play:', error);
            setAutoplayBlocked(true);
          });
      }
    } catch (error) {
      console.log('Error attempting video play:', error);
      setAutoplayBlocked(true);
    }
  };

  // Handle manual play button click
  const handleManualPlay = () => {
    const v = singleVideoRef.current;
    if (!v) return;

    try {
      v.play()
        .then(() => {
          setAutoplayBlocked(false);
          setVideosPlaying(true);
        })
        .catch((error) => {
          console.error('Error playing video:', error);
        });
    } catch (error) {
      console.error('Error playing video:', error);
    }
  };

  useEffect(() => {
    // Load video URLs when age is verified and videos are available
    if (heroVideos.length > 0 && ageVerified === true) {
      loadAllVideoUrls();
    }
  }, [heroVideos, ageVerified]);

  // Also trigger video URL loading when age verification changes to true
  useEffect(() => {
    if (ageVerified === true && heroVideos.length > 0 && videoUrls.length === 0) {
      loadAllVideoUrls();
    }
  }, [ageVerified, heroVideos.length]);

  // Set timeout for video loading (3 seconds)
  useEffect(() => {
    if (videoUrls.length > 0 && !videosPlaying && !videoError) {
      loadTimeoutRef.current = setTimeout(() => {
        setVideoLoadTimeout(true);
      }, 3000);
    }
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [videoUrls, videosPlaying, videoError]);

  // Auto-advance videos every 8 seconds
  useEffect(() => {
    if (heroVideos.length > 1) {
      const interval = setInterval(() => {
        setCurrentVideoIndex((prev) => (prev + 1) % heroVideos.length);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [heroVideos.length]);

  // Ensure current hero video autoplays reliably (single element approach)
  // Only autoplay if age is verified
  useEffect(() => {
    const v = singleVideoRef.current;
    const url = videoUrls[currentVideoIndex];
    if (!v || !videosLoaded || !url || ageVerified !== true) return;
    
    // Reset autoplay blocked state when video changes
    setAutoplayBlocked(false);
    try {
      // Stop and hard reset source before applying attributes
      try { v.pause(); } catch {}
      try { v.removeAttribute('src'); } catch {}
      try { v.load(); } catch {}

      // Apply attributes required for mobile autoplay BEFORE setting src
      v.muted = true;
      v.defaultMuted = true;
      try { v.setAttribute('muted', ''); } catch {}
      (v as HTMLVideoElement & { playsInline?: boolean }).playsInline = true;
      try { v.setAttribute('playsinline', 'true'); v.setAttribute('webkit-playsinline', 'true'); } catch {}
      try { v.setAttribute('autoplay', ''); } catch {}
      try { v.setAttribute('preload', 'auto'); } catch {}
      try { v.setAttribute('crossorigin', 'anonymous'); } catch {}

      // Now set the source and start playback
      v.src = url;
      v.load();
      try { const t = v.currentTime; v.currentTime = Math.max(0, t + 0.001); } catch {}
      const attemptPlay = () => v.play().catch(() => {});
      attemptPlay();
      setTimeout(attemptPlay, 150);
      setTimeout(attemptPlay, 500);
    } catch {}
  }, [videosLoaded, currentVideoIndex, videoUrls]);

  // Fallback: re-attempt autoplay when page becomes visible or gains focus
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const v = videoRefs.current[currentVideoIndex];
        try { v?.play().catch(() => {}); } catch {}
      }
    };
    const onFocus = () => {
      const v = videoRefs.current[currentVideoIndex];
      try { v?.play().catch(() => {}); } catch {}
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentVideoIndex]);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadHeroVideos = async () => {
    try {
      const { data, error } = await getHeroVideos();
      
      if (error) {
        console.error('Hero videos error:', error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setHeroVideos(data);
      }
    } catch (err) {
      console.error('Hero videos error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllVideoUrls = async () => {
    try {
      console.log('Loading hero video URLs, heroVideos count:', heroVideos.length);
      const urls = await Promise.all(
        heroVideos.map(async (video) => {
          // ✅ Use media_filename if available, otherwise fall back to video_path
          const videoPath = video.media_filename || video.video_path;
          if (!videoPath) {
            console.warn('Hero video has no path:', video);
            return '';
          }
          const { data, error } = await getSignedUrl('media', videoPath, 3600);
          if (error || !data) {
            console.error('Failed to get video URL for', videoPath, ':', error);
            return '';
          }
          console.log('Successfully loaded video URL for', videoPath);
          return data.signedUrl;
        })
      );
      const validUrls = urls.filter(url => url !== '');
      console.log('Loaded', validUrls.length, 'valid video URLs');
      setVideoUrls(validUrls);
      setVideosLoaded(true);
      
      // After URLs are loaded, attempt to play
      if (validUrls.length > 0 && ageVerified === true) {
        setTimeout(() => {
          attemptVideoPlay();
        }, 200);
      }
    } catch (err) {
      console.error('Failed to load video URLs:', err);
    }
  };

  const nextVideo = () => {
    if (heroVideos.length > 1) {
      setCurrentVideoIndex((prev) => (prev + 1) % heroVideos.length);
    }
  };

  const prevVideo = () => {
    if (heroVideos.length > 1) {
      setCurrentVideoIndex((prev) => (prev - 1 + heroVideos.length) % heroVideos.length);
    }
  };

  const currentVideo = heroVideos[currentVideoIndex];
  // No mobile tap overlay; we must autoplay like desktop

  return (
    <div className="relative h-screen bg-black overflow-hidden hero-container group" style={{ marginTop: '-3.5rem' }}>
      {/* Shimmering Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sage/20 to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60"></div>
      </div>

      {/* Optional Hero Videos - Only show if age is verified */}
      {ageVerified === true && videoUrls.length > 0 && !videoError && !videoLoadTimeout && (
        <div className="absolute inset-0 w-full h-full">
          <video
            key={currentVideoIndex}
            ref={singleVideoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 opacity-100`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            // src is set programmatically after attributes for better mobile autoplay compliance
            onPlay={() => {
              setVideosPlaying(true);
              setAutoplayBlocked(false);
              if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
              }
            }}
            onPause={() => setVideosPlaying(false)}
            onError={() => {
              setVideoError(true);
              if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
              }
            }}
            webkit-playsinline="true"
          />
          
          {/* Tap to Play Overlay - shown when autoplay is blocked */}
          {autoplayBlocked && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer z-10"
              onClick={handleManualPlay}
            >
              <button
                className="bg-white/90 hover:bg-white text-brand-pine rounded-full p-6 shadow-2xl transition-all transform hover:scale-110"
                aria-label="Play video"
              >
                <Play className="w-12 h-12" />
              </button>
              <p className="absolute bottom-8 text-white text-sm font-medium">
                Tap to play
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fallback static gradient background if video fails or times out */}
      {(videoError || videoLoadTimeout) && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sage/30 to-slate-900">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60"></div>
        </div>
      )}

      {/* No button overlay on mobile; autoplay enforced via attributes and retries */}

      {/* Enhanced Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center pt-14 sm:pt-16">
        <div className="text-center text-white max-w-4xl mx-auto px-4">
          <h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-6 text-shadow-lg animate-fade-in"
            style={{ 
              fontFamily: 'Vogue, serif',
              fontWeight: 'normal',
              letterSpacing: '0.05em',
              background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {currentVideo ? currentVideo.title : 'EXCLUSIVE LEX'}
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-200 mb-8 text-shadow animate-fade-in">
            {currentVideo ? currentVideo.subtitle : 'A private collection of sensual content'}
          </p>

          {/* Guiding subtext for non-signed-in users */}
          {!user && (
            <p className="text-lg sm:text-xl text-sage mb-6 text-shadow animate-fade-in">
              Login to unlock exclusive access to premium content
            </p>
          )}

          {/* CTA Button - Dynamic based on user authentication */}
          <div className="animate-fade-in">
            {user ? (
              <Link
                href="/albums"
                className="inline-flex items-center bg-gradient-to-r from-sage to-sage/80 hover:from-sage/90 hover:to-sage/70 text-white text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 rounded-full shadow-2xl hover:shadow-sage/25 transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <Play className="w-5 h-5 mr-2" />
                View Albums
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center bg-gradient-to-r from-sage to-sage/80 hover:from-sage/90 hover:to-sage/70 text-white text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 rounded-full shadow-2xl hover:shadow-sage/25 transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Login or Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Byline - Positioned below hero content */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-4xl mx-auto px-4">
        <p className="text-center text-sm sm:text-base font-medium tracking-wide uppercase text-white/90 animate-fade-in">
          By Alexis Griswold
        </p>
      </div>

      {/* Navigation Arrows - Only show if videos are available */}
      {heroVideos.length > 1 && (
        <>
          <button
            onClick={prevVideo}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 border border-white/20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextVideo}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 border border-white/20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator - Only show if videos are available */}
      {heroVideos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
          {heroVideos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentVideoIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentVideoIndex 
                  ? 'bg-white scale-125 shadow-lg' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 