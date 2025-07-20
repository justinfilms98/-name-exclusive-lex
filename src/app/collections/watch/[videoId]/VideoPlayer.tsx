"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface VideoPlayerProps {
  src: string;
  title: string;
  expiresAt?: string;
}

export default function VideoPlayer({ src, title, expiresAt }: VideoPlayerProps) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // Get current user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft(0);
        router.push("/collections");
      } else {
        setTimeLeft(Math.ceil(ms / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, router]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}` : `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {timeLeft !== null && timeLeft > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
          Time left: {formatTime(timeLeft)}
        </div>
      )}
      <video
        src={src}
        controls
        className="w-full h-auto"
        style={{ maxHeight: "80vh" }}
        onContextMenu={(e) => e.preventDefault()}
        controlsList="nodownload"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="mt-4 text-center">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
    </div>
  );
} 