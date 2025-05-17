"use client";
import { useEffect, useState, useRef } from "react";

interface HeroVideo {
  id: number;
  videoUrl: string;
  order: number;
  title?: string;
  description?: string;
}

export default function HeroSection() {
  const [videos, setVideos] = useState<HeroVideo[]>([]);
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/hero-videos")
      .then((res) => res.json())
      .then((data) => {
        setVideos(
          data
            .sort((a: HeroVideo, b: HeroVideo) => a.order - b.order)
            .slice(0, 3)
        );
      });
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
    <div className="relative flex flex-col items-center justify-center w-full min-h-[80vh] overflow-hidden">
      {/* Video backgrounds */}
      {videos.map((video, idx) => (
        <video
          key={video.id}
          src={video.videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className={`fixed top-0 left-0 w-screen h-screen object-cover transition-opacity duration-1000 ${
            idx === current ? "opacity-100 z-0" : "opacity-0 z-0"
          }`}
          style={{ pointerEvents: "none" }}
        />
      ))}
      {/* Overlay hero text, unique per video */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-[60vh] bg-black/10">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-green-900 text-center drop-shadow-lg">
          {videos[current]?.title || 'Experience Pure Intimacy'}
        </h1>
        <p className="text-xl md:text-2xl text-green-800 mb-8 text-center drop-shadow">
          {videos[current]?.description || 'Curated collection of authentic, passionate moments'}
        </p>
        <a href="/collections">
          <button className="bg-green-900 text-white px-6 py-2 rounded hover:bg-green-800 transition">
            Explore Collections
          </button>
        </a>
      </div>
      {/* Overlay for darkening video if needed */}
      <div className="fixed inset-0 bg-black/30 z-0 pointer-events-none" />
    </div>
  );
} 