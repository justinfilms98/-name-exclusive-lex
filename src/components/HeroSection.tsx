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
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const singleVideoRef = useRef<HTMLVideoElement | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playAttemptedRef = useRef<boolean>(false);
  const retryTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Check age verification before loading videos
    if (typeof window !== 'undefined') {
      const verified = localStorage.getItem('exclusivelex_age_verified');
      const isVerified = verified === 'true';
      setAgeVerified(isVerified);
    }
    loadHeroVideos();
    loadUser();
  }, []);

  // Listen for age verification event
  useEffect(() => {
    const handleAgeVerified = () => {
      setAgeVerified(true);
      playAttemptedRef.current = false; // Reset play attempt flag
      setAutoplayFailed(false); // Reset autoplay failed state
      // Load video URLs if not already loaded
      if (heroVideos.length > 0 && videoUrls.length === 0) {
        loadAllVideoUrls();
      }
      // After a short delay, attempt playback (to ensure video URLs are loaded if they were just requested)
      // This handles the case when age gate closes
      setTimeout(() => {
        if (singleVideoRef.current && videoUrls.length > 0 && videosLoaded) {
          attemptVideoPlaybackWithRetries();
        }
      }, 500);
    };

    window.addEventListener('exclusivelex:age-verified', handleAgeVerified);
    return () => {
      window.removeEventListener('exclusivelex:age-verified', handleAgeVerified);
    };
  }, [heroVideos.length, videoUrls.length]);

  // Function to attempt video playback (called when age is verified)
  // This is now only used for manual play button, not for autoplay
  const attemptVideoPlay = () => {
    // Prevent multiple simultaneous play attempts
    if (playAttemptedRef.current) {
      return;
    }

    const v = singleVideoRef.current;
    if (!v || !ageVerified) {
      return;
    }

    if (!videosLoaded || videoUrls.length === 0) {
      // If videos aren't loaded but we have hero videos, try loading them
      if (heroVideos.length > 0) {
        loadAllVideoUrls();
      }
      return;
    }

    const url = videoUrls[currentVideoIndex];
    if (!url) {
      return;
    }

    playAttemptedRef.current = true;
    try {
      v.muted = true;
      v.defaultMuted = true;
      (v as HTMLVideoElement & { playsInline?: boolean }).playsInline = true;
      
      if (!v.src || v.src !== url) {
        v.src = url;
        v.load();
      }
      
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAutoplayBlocked(false);
            setVideosPlaying(true);
            playAttemptedRef.current = false; // Reset after successful play
          })
          .catch((error) => {
            console.log('Autoplay blocked, showing tap-to-play:', error);
            setAutoplayBlocked(true);
            playAttemptedRef.current = false; // Reset on error
          });
      }
    } catch (error) {
      console.log('Error attempting video play:', error);
      setAutoplayBlocked(true);
      playAttemptedRef.current = false; // Reset on error
    }
  };

  // Handle manual play button click
  const handleManualPlay = () => {
    playAttemptedRef.current = false; // Reset flag for manual play
    const v = singleVideoRef.current;
    if (!v) return;

    try {
      v.play()
        .then(() => {
          setAutoplayBlocked(false);
          setAutoplayFailed(false);
          setVideosPlaying(true);
        })
        .catch((error) => {
          console.error('Error playing video:', error);
        });
    } catch (error) {
      console.error('Error playing video:', error);
    }
  };

  // Attempt video playback with retries (used after login/session resolution and after age gate closes)
  const attemptVideoPlaybackWithRetries = () => {
    const v = singleVideoRef.current;
    const url = videoUrls[currentVideoIndex];
    
    if (!v || !url || ageVerified !== true) return;

    // Clear any existing retry timeouts
    retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    retryTimeoutsRef.current = [];

    const attemptPlay = (delay: number) => {
      const timeoutId = setTimeout(() => {
        try {
          if (v.src !== url) {
            v.src = url;
            v.load();
          }
          
          // Ensure mobile-friendly attributes
          v.muted = true;
          v.setAttribute('muted', '');
          v.setAttribute('playsinline', 'true');
          v.setAttribute('webkit-playsinline', 'true');
          v.setAttribute('autoplay', '');
          
          const playPromise = v.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setAutoplayBlocked(false);
                setAutoplayFailed(false);
                setVideosPlaying(true);
              })
              .catch((error) => {
                console.log('Autoplay retry failed:', error);
                if (delay >= 1000) {
                  // Final retry failed, show tap to play
                  setAutoplayFailed(true);
                  setAutoplayBlocked(true);
                }
              });
          }
        } catch (error) {
          console.error('Error in playback retry:', error);
          if (delay >= 1000) {
            setAutoplayFailed(true);
            setAutoplayBlocked(true);
          }
        }
      }, delay);
      
      retryTimeoutsRef.current.push(timeoutId);
    };

    // Immediate attempt
    attemptPlay(0);
    // Retry after 250ms
    attemptPlay(250);
    // Retry after 1000ms
    attemptPlay(1000);
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

  // Attempt video playback with retries (used after login/session resolution)
  const attemptVideoPlaybackWithRetries = () => {
    const v = singleVideoRef.current;
    const url = videoUrls[currentVideoIndex];
    
    if (!v || !url || ageVerified !== true) return;

    // Clear any existing retry timeouts
    retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    retryTimeoutsRef.current = [];

    const attemptPlay = (delay: number) => {
      const timeoutId = setTimeout(() => {
        try {
          if (v.src !== url) {
            v.src = url;
            v.load();
          }
          
          // Ensure mobile-friendly attributes
          v.muted = true;
          v.setAttribute('muted', '');
          v.setAttribute('playsinline', 'true');
          v.setAttribute('webkit-playsinline', 'true');
          v.setAttribute('autoplay', '');
          
          const playPromise = v.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setAutoplayBlocked(false);
                setAutoplayFailed(false);
                setVideosPlaying(true);
              })
              .catch((error) => {
                console.log('Autoplay retry failed:', error);
                if (delay >= 1000) {
                  // Final retry failed, show tap to play
                  setAutoplayFailed(true);
                  setAutoplayBlocked(true);
                }
              });
          }
        } catch (error) {
          console.error('Error in playback retry:', error);
          if (delay >= 1000) {
            setAutoplayFailed(true);
            setAutoplayBlocked(true);
          }
        }
      }, delay);
      
      retryTimeoutsRef.current.push(timeoutId);
    };

    // Immediate attempt
    attemptPlay(0);
    // Retry after 250ms
    attemptPlay(250);
    // Retry after 1000ms
    attemptPlay(1000);
  };

  // Effect that runs when BOTH ageVerified === true AND video ref is set
  // This handles initial load and also triggers after login
  useEffect(() => {
    if (ageVerified === true && singleVideoRef.current && videoUrls.length > 0 && videosLoaded) {
      // Reset play attempt flag when conditions are met
      playAttemptedRef.current = false;
      setAutoplayFailed(false);
      
      // Attempt playback with retries
      attemptVideoPlaybackWithRetries();
    }

    // Cleanup timeouts on unmount
    return () => {
      retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      retryTimeoutsRef.current = [];
    };
  }, [ageVerified, videosLoaded, videoUrls.length, currentVideoIndex]);

  // Ensure current hero video autoplays reliably (single element approach)
  // Only autoplay if age is verified
  useEffect(() => {
    const v = singleVideoRef.current;
    const url = videoUrls[currentVideoIndex];
    if (!v || !videosLoaded || !url || ageVerified !== true) return;
    
    // Prevent multiple play attempts - if already playing, don't interfere
    if (playAttemptedRef.current && videosPlaying) {
      return;
    }
    
    // Only reset and attempt play if video src changed or not playing
    const shouldReset = !v.src || v.src !== url || (!videosPlaying && !autoplayBlocked);
    if (!shouldReset) {
      return; // Video is already set up and playing, let it loop naturally
    }
    
    // Reset autoplay blocked state when video changes
    setAutoplayBlocked(false);
    setAutoplayFailed(false);
    playAttemptedRef.current = true;
    
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
      
      // Single play attempt - video's loop attribute will handle looping
      const attemptPlay = () => {
        v.play()
          .then(() => {
            setAutoplayBlocked(false);
            setAutoplayFailed(false);
            setVideosPlaying(true);
            playAttemptedRef.current = false; // Reset after successful play
          })
          .catch((error) => {
            console.log('Autoplay blocked:', error);
            setAutoplayBlocked(true);
            setAutoplayFailed(true);
            playAttemptedRef.current = false; // Reset on error
          });
      };
      
      // Only attempt once - let the video element handle looping
      attemptPlay();
    } catch (error) {
      playAttemptedRef.current = false;
      setAutoplayFailed(true);
      console.error('Error setting up video:', error);
    }
  }, [videosLoaded, currentVideoIndex, videoUrls, ageVerified, videosPlaying, autoplayBlocked]);

  // Fallback: re-attempt autoplay when page becomes visible or gains focus
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && ageVerified === true) {
        const v = singleVideoRef.current;
        if (v && videoUrls.length > 0) {
          try { 
            v.play().then(() => {
              setAutoplayBlocked(false);
              setAutoplayFailed(false);
              setVideosPlaying(true);
            }).catch(() => {
              setAutoplayFailed(true);
              setAutoplayBlocked(true);
            });
          } catch {}
        }
      }
    };
    const onFocus = () => {
      if (ageVerified === true) {
        const v = singleVideoRef.current;
        if (v && videoUrls.length > 0) {
          try { 
            v.play().then(() => {
              setAutoplayBlocked(false);
              setAutoplayFailed(false);
              setVideosPlaying(true);
            }).catch(() => {
              setAutoplayFailed(true);
              setAutoplayBlocked(true);
            });
          } catch {}
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentVideoIndex, ageVerified, videoUrls.length]);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  // Listen for auth state changes (login/logout)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        
        // If user just logged in and age is verified, retry video playback
        if (event === 'SIGNED_IN' && ageVerified === true && singleVideoRef.current && videoUrls.length > 0 && videosLoaded) {
          // Small delay to ensure DOM is ready after login redirect
          setTimeout(() => {
            attemptVideoPlaybackWithRetries();
          }, 500);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [ageVerified, videoUrls.length, videosLoaded]);

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
      // Don't call attemptVideoPlay here - let the existing autoplay useEffect handle it
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
          
          {/* Tap to Play Overlay - shown when autoplay is blocked OR failed (especially on mobile) */}
          {(autoplayBlocked || autoplayFailed) && (() => {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            return (isMobile || autoplayFailed) ? (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer z-10"
                onClick={() => {
                  handleManualPlay();
                  setAutoplayFailed(false);
                }}
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
            ) : null;
          })()}
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