"use client";
import React from 'react';
import { useEffect, useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

interface HeroVideo {
  id: number;
  videoUrl: string;
  order?: number;
  title?: string;
  subtitle?: string;
}

export default function HeroSection() {
  const [videos, setVideos] = useState<HeroVideo[]>([]);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const sessionHook = typeof useSession === 'function' ? useSession() : undefined;
  const session = sessionHook?.data;
  const status = sessionHook?.status;

  useEffect(() => {
    function fetchVideos() {
      console.log('Fetching hero videos from client...');
      fetch("/api/hero-videos")
        .then((res) => {
          console.log('Hero videos response status:', res.status);
          return res.json();
        })
        .then((data) => {
          console.log('Hero videos data:', data);
          if (Array.isArray(data)) {
            setVideos(
              data
                .sort((a: HeroVideo, b: HeroVideo) => (a.order ?? 0) - (b.order ?? 0))
                .slice(0, 3)
            );
          } else {
            console.error('Expected array but got:', typeof data);
          }
        })
        .catch((error) => {
          console.error('Error fetching hero videos:', error);
        });
    }
    fetchVideos();
    // Listen for custom event to refresh videos
    function handleUpdate() {
      fetchVideos();
    }
    window.addEventListener('heroVideosUpdated', handleUpdate);
    return () => {
      window.removeEventListener('heroVideosUpdated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (videos.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % videos.length);
      }, 9000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    return undefined;
  }, [videos]);

  if (videos.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center w-full min-h-screen h-screen overflow-hidden bg-stone-900">
        <div className="text-center text-white z-10">
          <h1 className="text-6xl font-serif mb-4">Exclusive Lex</h1>
          <p className="text-xl text-stone-300 mb-8">Loading exclusive content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen h-screen overflow-hidden">
      {/* Video Backgrounds */}
      {videos.map((video, index) => (
        <div
          key={video.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            src={video.videoUrl}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-6xl md:text-8xl font-serif mb-6 animate-fade-in">
          Exclusive Lex
        </h1>
        {videos[current]?.title && (
          <h2 className="text-2xl md:text-4xl font-light mb-4 animate-fade-in-delay">
            {videos[current].title}
          </h2>
        )}
        {videos[current]?.subtitle && (
          <p className="text-lg md:text-xl text-stone-300 mb-8 animate-fade-in-delay-2">
            {videos[current].subtitle}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-3">
          {status === 'loading' ? null : session ? (
            <button
              onClick={() => router.push('/collections')}
              className="bg-white text-stone-900 px-8 py-3 rounded-md font-medium hover:bg-stone-100 transition-colors"
            >
              Explore Collections
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="border border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-stone-900 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Navigation Dots */}
      {videos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === current ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 