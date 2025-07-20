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
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadHeroVideos();
  }, []);

  useEffect(() => {
    if (heroVideos.length > 0) {
      loadVideoUrl(heroVideos[currentVideoIndex]);
    }
  }, [heroVideos, currentVideoIndex]);

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

  const loadVideoUrl = async (video: HeroVideo) => {
    try {
      const { data, error } = await getSignedUrl('media', video.video_path, 3600);
      
      if (error || !data) {
        console.error('Failed to get video URL:', error);
        return;
      }

      setVideoUrl(data.signedUrl);
    } catch (err) {
      console.error('Failed to get video URL:', err);
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
      <div className="relative h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading exclusive content...</p>
        </div>
      </div>
    );
  }

  if (error || heroVideos.length === 0) {
    return (
      <div className="relative h-screen bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center">
        <div className="text-center text-white max-w-2xl mx-auto px-4">
          <h1 className="text-6xl font-serif mb-6">Exclusive Lex</h1>
          <p className="text-xl text-stone-200 mb-8">
            Premium video content with limited-time access
          </p>
          <div className="text-stone-400 text-sm">
            {error || 'Hero videos will appear here once uploaded'}
          </div>
        </div>
      </div>
    );
  }

  const currentVideo = heroVideos[currentVideoIndex];

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Background Video */}
      {videoUrl && (
        <video
          key={currentVideo.id}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-6xl font-serif mb-4 drop-shadow-lg">
            {currentVideo.title}
          </h1>
          {currentVideo.subtitle && (
            <p className="text-xl text-stone-200 mb-8 drop-shadow-lg">
              {currentVideo.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      {heroVideos.length > 1 && (
        <>
          <button
            onClick={prevVideo}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextVideo}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
            {heroVideos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentVideoIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentVideoIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
} 