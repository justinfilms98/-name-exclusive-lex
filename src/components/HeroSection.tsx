"use client";
import { useEffect, useState, useRef } from "react";
import { useSession, signIn } from "next-auth/react";

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
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  useEffect(() => {
    function fetchVideos() {
      fetch("/api/hero-videos")
        .then((res) => res.json())
        .then((data) => {
          setVideos(
            data
              .sort((a: HeroVideo, b: HeroVideo) => a.order - b.order)
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
      {/* Video backgrounds */}
      {videos.map((video, idx) => (
        <video
          key={video.id}
          src={video.videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className={`fixed top-0 left-0 w-screen h-screen object-cover transition-opacity duration-1000 parallax-bg ${
            idx === current ? "opacity-100 z-0" : "opacity-0 z-0"
          }`}
          style={{ pointerEvents: "none", zIndex: 0 }}
        />
      ))}
      {/* Overlay hero text, unique per video */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        <div className="bg-[#654C37]/[0.04] px-12 py-8 rounded-[3rem] backdrop-blur-sm border border-[#C9BBA8]/[0.12] shadow-lg max-w-2xl mx-auto flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-[#F2E0CF] text-center [text-shadow:_0_2px_4px_rgba(0,0,0,0.3)] text-reveal">
            {videos[current]?.title || 'Intimacy, Redefined'}
          </h1>
          <p className="text-xl md:text-2xl text-[#F2E0CF] mb-0 text-center [text-shadow:_0_1px_2px_rgba(0,0,0,0.2)] text-reveal text-reveal-delay-1">
            {videos[current]?.description || 'A private collection of sensual elegance'}
          </p>
        </div>
        <div className="mt-8 text-reveal text-reveal-delay-2">
          {!isLoggedIn ? (
            <button
              className="bg-[#654C37] text-[#F2E0CF] px-8 py-3 rounded-full hover:bg-[#654C37]/90 transition-all duration-300 hover-lift focus-ring border border-[#C9BBA8]/[0.12] shadow-lg text-lg font-semibold"
              onClick={() => signIn()}
            >
              Login
            </button>
          ) : (
            <a href="/collections">
              <button className="bg-[#654C37] text-[#F2E0CF] px-8 py-3 rounded-full hover:bg-[#654C37]/90 transition-all duration-300 hover-lift focus-ring border border-[#C9BBA8]/[0.12] shadow-lg text-lg font-semibold">
                Explore Collections
              </button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
} 