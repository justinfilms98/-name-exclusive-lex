"use client";

import { useState, useEffect } from 'react';
import { getHeroVideos, getSignedUrl } from '@/lib/supabase';

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

  useEffect(() => {
    loadHeroVideos();
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

  if (loading) {
    return (
      <div className="relative h-screen bg-gradient-to-br from-sand to-stone-300 flex items-center justify-center">
        <div className="text-center text-pearl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pearl mx-auto mb-4"></div>
          <p className="text-green">Loading exclusive content...</p>
        </div>
      </div>
    );
  }

  if (error || heroVideos.length === 0) {
    return (
      <div className="relative h-screen bg-gradient-to-br from-sand via-stone-200 to-stone-300 flex items-center justify-center">
        <div className="text-center text-pearl max-w-2xl mx-auto px-4">
          <h1 className="text-6xl font-serif mb-6">Exclusive Lex</h1>
          <p className="text-xl text-green mb-8">
            Premium video content with limited-time access
          </p>
          <div className="text-salmon text-sm">
            {error || 'Hero videos will appear here once uploaded'}
          </div>
        </div>
      </div>
    );
  }

  const currentVideo = heroVideos[currentVideoIndex];
  const currentVideoUrl = videoUrls[currentVideoIndex];

  return (
    <div className="relative h-screen bg-black overflow-hidden hero-container group">
      {/* Background Videos with Crossfade */}
      {videoUrls.map((videoUrl, index) => (
        <video
          key={heroVideos[index]?.id || index}
          className={`absolute inset-0 w-full h-full object-cover hero-crossfade ${
            index === currentVideoIndex ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ))}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="text-center text-pearl max-w-4xl mx-auto px-4">
          <h1 className="text-6xl md:text-7xl font-serif mb-4 drop-shadow-2xl">
            {currentVideo.title}
          </h1>
          {currentVideo.subtitle && (
            <p className="text-xl md:text-2xl text-green mb-8 drop-shadow-lg">
              {currentVideo.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Navigation Arrows - Hidden unless hovered */}
      {heroVideos.length > 1 && (
        <>
          <button
            onClick={prevVideo}
            className="hero-arrow absolute left-6 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-30 hover:bg-opacity-50 text-pearl p-4 rounded-full hover:text-salmon transition-all duration-300 backdrop-blur-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextVideo}
            className="hero-arrow absolute right-6 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-30 hover:bg-opacity-50 text-pearl p-4 rounded-full hover:text-salmon transition-all duration-300 backdrop-blur-sm"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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
                  ? 'bg-salmon scale-125' 
                  : 'bg-pearl bg-opacity-50 hover:bg-opacity-75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 