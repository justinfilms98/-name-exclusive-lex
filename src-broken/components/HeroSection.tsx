"use client";
import React from 'react';
import { useEffect, useState, useRef } from "react";
import { useRouter } from 'next/navigation';

interface HeroVideo {
  id: number;
  videoUrl: string;
  displayOrder?: number;
  title?: string;
  subtitle?: string;
}

export default function HeroSection() {
  // TODO: Re-implement HeroSection logic if needed.
  const [videos, setVideos] = useState<HeroVideo[]>([]);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    function fetchVideos() {
      fetch("/api/hero-videos")
        .then((res) => res.json())
        .then((data) => {
          setVideos(
            data
              .sort((a: HeroVideo, b: HeroVideo) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
              .slice(0, 3)
          );
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

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen h-screen overflow-hidden parallax-container">
      {/* TODO: Video backgrounds and content go here. */}
    </div>
  );
} 