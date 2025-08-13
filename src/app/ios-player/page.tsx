"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface IOSPlayerPayload {
  src: string;
  title?: string;
  startTime?: number;
  wasPlaying?: boolean;
}

export default function IOSPlayerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [payload, setPayload] = useState<IOSPlayerPayload | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    // 1) Primary: sessionStorage handoff
    try {
      const raw = sessionStorage.getItem("ios-player");
      if (raw) {
        const data: IOSPlayerPayload = JSON.parse(raw);
        if (data && data.src) {
          setPayload(data);
          return;
        }
      }
    } catch {
      // ignore
    }

    // 2) Fallback: try URL param `u` (base64) or `src`
    try {
      const b64 = searchParams?.get("u");
      const direct = searchParams?.get("src");
      let src: string | null = null;
      if (b64) {
        src = atob(b64);
      } else if (direct) {
        src = direct;
      }
      if (src) {
        const t = Number(searchParams?.get("t") || "0");
        const title = searchParams?.get("title") || undefined;
        setPayload({ src, title, startTime: isFinite(t) ? t : 0, wasPlaying: false });
        return;
      }
    } catch {
      // ignore
    }
  }, [searchParams]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !payload) return;

    const onLoaded = () => {
      try {
        if (typeof payload.startTime === "number") {
          el.currentTime = Math.max(0, payload.startTime || 0);
        }
        // Nudge to avoid black frame on iOS
        const t = el.currentTime;
        el.currentTime = Math.max(0, t + 0.001);
      } catch {}

      // Try autoplay muted; user can unmute
      el.muted = true;
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    };

    el.addEventListener("loadedmetadata", onLoaded, { once: true });
    return () => {
      try { el.removeEventListener("loadedmetadata", onLoaded as any); } catch {}
    };
  }, [payload]);

  const handleClose = () => {
    const el = videoRef.current;
    const lastTime = el ? el.currentTime : payload?.startTime || 0;
    const wasPlaying = !!isPlaying;
    try {
      sessionStorage.setItem(
        "ios-player-return",
        JSON.stringify({ src: payload?.src, lastTime, wasPlaying })
      );
    } catch {}
    try { if (el) el.pause(); } catch {}
    router.back();
  };

  const togglePlay = async () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      try {
        await el.play();
        setIsPlaying(true);
      } catch {}
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  };

  if (!payload) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p>Preparing player… If this persists, go back and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[100000]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
        <button onClick={handleClose} className="text-white px-3 py-2 bg-white/10 rounded">
          Done
        </button>
        <div className="text-white text-sm truncate max-w-[60%]">{payload.title || ""}</div>
        <div className="w-16" />
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        src={payload.src}
        className="w-[100vw] h-[100vh] object-contain"
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{ backgroundColor: "black" }}
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between">
        <button onClick={togglePlay} className="text-white px-4 py-2 bg-white/10 rounded">
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button onClick={toggleMute} className="text-white px-4 py-2 bg-white/10 rounded">
          {isMuted ? "Unmute" : "Mute"}
        </button>
      </div>

      {/* Center play prompt if not playing */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button onClick={togglePlay} className="text-white px-5 py-3 bg-white/10 rounded-full border border-white/30">
            Tap to Play
          </button>
        </div>
      )}
    </div>
  );
}


