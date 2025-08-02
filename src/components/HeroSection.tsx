"use client";

import { useState, useEffect } from 'react';
import { getHeroVideos, getSignedUrl, supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Play, Sparkles } from 'lucide-react';
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
  const [videosPlaying, setVideosPlaying] = useState(false);

  useEffect(() => {
    loadHeroVideos();
    loadUser();
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

  const currentVideo = heroVideos[currentVideoIndex];

  return (
    <div className="relative h-screen bg-black overflow-hidden hero-container group" style={{ marginTop: '-3.5rem' }}>
      {/* Shimmering Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sage/20 to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60"></div>
      </div>

      {/* Optional Hero Videos */}
      {videoUrls.length > 0 && videoUrls.map((videoUrl, index) => (
        <video
          key={heroVideos[index]?.id || index}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            index === currentVideoIndex ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay={true}
          muted={true}
          loop
          playsInline
          preload="auto"
          onPlay={() => setVideosPlaying(true)}
          onPause={() => setVideosPlaying(false)}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
        </video>
      ))}

      {/* Enhanced Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

      {/* Floating Sparkles Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 animate-pulse">
          <Sparkles className="w-4 h-4 text-white/20" />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-pulse delay-1000">
          <Sparkles className="w-3 h-3 text-white/15" />
        </div>
        <div className="absolute bottom-1/3 left-1/3 animate-pulse delay-2000">
          <Sparkles className="w-5 h-5 text-white/25" />
        </div>
        <div className="absolute bottom-1/4 right-1/3 animate-pulse delay-1500">
          <Sparkles className="w-2 h-2 text-white/10" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center pt-14 sm:pt-16">
        <div className="text-center text-white max-w-4xl mx-auto px-4">
          <div className="hero-text-container bg-black/30 backdrop-blur-md rounded-2xl p-8 sm:p-12 border border-white/20 shadow-2xl">
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
                  href="/collections"
                  className="inline-flex items-center bg-gradient-to-r from-sage to-sage/80 hover:from-sage/90 hover:to-sage/70 text-white text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-5 rounded-full shadow-2xl hover:shadow-sage/25 transition-all duration-300 transform hover:scale-105 font-semibold"
                >
                  <Play className="w-5 h-5 mr-2" />
                  View Collections
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