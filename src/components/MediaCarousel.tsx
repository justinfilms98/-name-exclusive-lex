"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { getSignedUrl } from '@/lib/supabase';

interface MediaItem {
  id: string;
  type: 'video' | 'image';
  path: string;
  signedUrl?: string;
}

interface MediaCarouselProps {
  videoPath: string;
  photoPaths: string[];
  onPlay?: () => void;
  onPause?: () => void;
}

export default function MediaCarousel({ videoPath, photoPaths, onPlay, onPause }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const loadMedia = async () => {
      const items: MediaItem[] = [];
      
      // Add video as first item
      if (videoPath) {
        const { data: signedUrl } = await getSignedUrl('media', videoPath);
        items.push({
          id: 'video',
          type: 'video',
          path: videoPath,
          signedUrl: signedUrl?.signedUrl
        });
      }

      // Add photos
      for (let i = 0; i < photoPaths.length; i++) {
        const { data: signedUrl } = await getSignedUrl('media', photoPaths[i]);
        items.push({
          id: `photo-${i}`,
          type: 'image',
          path: photoPaths[i],
          signedUrl: signedUrl?.signedUrl
        });
      }

      setMediaItems(items);
      setLoading(false);
    };

    loadMedia();
  }, [videoPath, photoPaths]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  };

  if (loading) {
    return (
      <div className="aspect-video bg-stone-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-stone-300">Loading media...</p>
        </div>
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className="aspect-video bg-stone-700 flex items-center justify-center">
        <p className="text-stone-300">No media available</p>
      </div>
    );
  }

  const currentItem = mediaItems[currentIndex];

  return (
    <div className="relative bg-stone-800 rounded-lg overflow-hidden video-container">
      {/* Media Display */}
      <div className="relative aspect-video">
        {currentItem.type === 'video' ? (
          <video
            className="w-full h-full object-cover"
            controls={false}
            autoPlay={currentIndex === 0}
            loop
            muted
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <source src={currentItem.signedUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={currentItem.signedUrl}
            alt="Collection photo"
            className="w-full h-full object-cover"
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          />
        )}

        {/* Custom Controls Overlay */}
        <div className="video-overlay flex items-center justify-center">
          {currentItem.type === 'video' && (
            <button
              onClick={handlePlayPause}
              className="bg-black bg-opacity-50 text-white p-4 rounded-full hover:bg-opacity-70 transition-all"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </button>
          )}
        </div>

        {/* Navigation Arrows */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {mediaItems.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {mediaItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Media Type Indicator */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {currentItem.type === 'video' ? 'VIDEO' : 'PHOTO'} {currentIndex + 1}/{mediaItems.length}
      </div>
    </div>
  );
} 