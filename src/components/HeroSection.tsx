"use client";

import { useState, useEffect } from 'react';
import { getHeroVideos, getSignedUrl, supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface HeroVideo {
  id: string;
  title: string;
  subtitle?: string;
  video_path: string;
  order_index: number;
}

export default function HeroSection() {
  const [heroVideos, setHeroVideos] = useState<HeroVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [videosPlaying, setVideosPlaying] = useState(false);

  useEffect(() => {
    loadHeroVideos();
    loadUser();
    
    // Detect mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
  }, []);

  useEffect(() => {
    if (heroVideos.length > 0) {
      loadAllVideoUrls();
    }
  }, [heroVideos]);

  // Auto-advance videos every 8 seconds
  useEffect(() => {
    if (heroVideos.length > 1) {
      const interval = setInterval(() => {
        setCurrentVideoIndex((prev) => (prev + 1) % heroVideos.length);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [heroVideos.length]);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadHeroVideos = async () => {
    try {
      const { data, error } = await getHeroVideos();
      
      if (error) {
        setError('Failed to load hero videos');
        console.error('Hero videos error:', error);
        return;
      }

      if (data && data.length > 0) {
        setHeroVideos(data);
      } else {
        setError('No hero videos available');
      }
    } catch (err) {
      setError('Failed to load hero videos');
      console.error('Hero videos error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllVideoUrls = async () => {
    try {
      const urls = await Promise.all(
        heroVideos.map(async (video) => {
          const { data, error } = await getSignedUrl('media', video.video_path, 3600);
          if (error || !data) {
            console.error('Failed to get video URL:', error);
            return '';
          }
          return data.signedUrl;
        })
      );
      setVideoUrls(urls.filter(url => url !== ''));
      setVideosLoaded(true);
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

  const handleVideoLoad = (videoElement: HTMLVideoElement) => {
    // For mobile devices, try to autoplay immediately
    if (isMobile) {
      // Try to play immediately
      videoElement.play().then(() => {
        setVideosPlaying(true);
        videoElement.muted = false; // Enable audio after successful play
      }).catch(() => {
        // If autoplay fails, set up user interaction handlers
        console.log('Autoplay blocked on mobile, waiting for user interaction');
        const playVideo = () => {
          videoElement.muted = false;
          videoElement.play().then(() => {
            setVideosPlaying(true);
          }).catch(() => {
            console.log('Playback failed');
          });
          document.removeEventListener('touchstart', playVideo);
          document.removeEventListener('click', playVideo);
        };
        
        document.addEventListener('touchstart', playVideo, { once: true });
        document.addEventListener('click', playVideo, { once: true });
      });
    }
  };

  if (loading) {
    return (
      <div className="relative h-screen bg-gradient-to-br from-almond via-mushroom to-blanket flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Loading exclusive content...</p>
        </div>
      </div>
    );
  }

  if (error || heroVideos.length === 0) {
    return (
      <div className="relative h-screen bg-gradient-to-br from-almond via-mushroom to-blanket flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="heading-1 mb-6 text-shadow-lg">Exclusive Lex</h1>
          <p className="body-large text-sage mb-8">
            Premium exclusive content with limited-time access
          </p>
          <div className="text-khaki">
            {error || 'Hero videos will appear here once uploaded by admin'}
          </div>
        </div>
      </div>
    );
  }

  const currentVideo = heroVideos[currentVideoIndex];

  return (
    <div className="relative h-screen bg-black overflow-hidden hero-container group">
      {/* Background Videos with Crossfade */}
      {videoUrls.map((videoUrl, index) => (
        <video
          key={heroVideos[index]?.id || index}
          className={`absolute inset-0 w-full h-full object-cover hero-crossfade ${
            index === currentVideoIndex ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay={!isMobile}
          muted={isMobile}
          loop
          playsInline
          preload="metadata"
          onLoadedData={(e) => handleVideoLoad(e.currentTarget)}
          onPlay={() => setVideosPlaying(true)}
          onPause={() => setVideosPlaying(false)}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
        </video>
      ))}

      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

      {/* Mobile Play Button Overlay - Only show when videos are not playing */}
      {isMobile && videosLoaded && !videosPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <button
            onClick={() => {
              const videos = document.querySelectorAll('video');
              videos.forEach(video => {
                video.muted = false;
                video.play().then(() => {
                  setVideosPlaying(true);
                }).catch(() => {
                  console.log('Playback failed');
                });
              });
            }}
            className="bg-black/50 text-white p-6 rounded-full backdrop-blur-sm hover:bg-black/70 transition-all"
          >
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="text-center text-blanc max-w-4xl mx-auto px-4">
          <div className="hero-text-container bg-black/20 backdrop-blur-sm rounded-lg p-8 border border-amber-200/30 shadow-2xl">
            <h1 
              className="text-5xl md:text-6xl lg:text-7xl mb-4 text-shadow-lg animate-fade-in"
              style={{ 
                fontFamily: 'Vogue, serif',
                fontWeight: 'normal',
                letterSpacing: '0.05em'
              }}
            >
              {currentVideo.title}
            </h1>
            {currentVideo.subtitle && (
              <p className="text-xl md:text-2xl lg:text-3xl text-blanket mb-8 text-shadow animate-fade-in">
                {currentVideo.subtitle}
              </p>
            )}

            {/* CTA Button - Only show when user is signed in */}
            {user && (
              <div className="animate-fade-in">
                <Link
                  href="/collections"
                  className="inline-flex items-center btn-primary text-lg px-8 py-4 shadow-elegant hover:shadow-glass"
                >
                  View Collections
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Hidden unless hovered */}
      {heroVideos.length > 1 && (
        <>
          <button
            onClick={prevVideo}
            className="hero-controls absolute left-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-blanc p-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextVideo}
            className="hero-controls absolute right-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-blanc p-4 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {heroVideos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
          {heroVideos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentVideoIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentVideoIndex 
                  ? 'bg-blanc scale-125 shadow-lg' 
                  : 'bg-blanc/50 hover:bg-blanc/75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {heroVideos.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="progress-bar h-1">
            <div 
              className="progress-fill h-full"
              style={{ 
                width: `${((currentVideoIndex + 1) / heroVideos.length) * 100}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 