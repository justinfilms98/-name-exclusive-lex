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
  const [isVertical, setIsVertical] = useState<boolean | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

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
        // Detect orientation
        const vw = el.videoWidth || 0;
        const vh = el.videoHeight || 0;
        if (vw && vh) setIsVertical(vh > vw);
      } catch {}

      // Try autoplay muted; user can unmute
      el.muted = true;
      el.play().then(() => { setIsPlaying(true); setPlayError(null); setIsBuffering(false); }).catch((e) => { setIsPlaying(false); setPlayError('tap'); setIsBuffering(false); });
    };

    const onCanPlay = () => setIsBuffering(false);
    const onWaiting = () => setIsBuffering(true);
    const onTime = () => { if (!isSeeking) setCurrentTime(el.currentTime); };
    const onMeta = () => { setDuration(el.duration || 0); };

    el.addEventListener("loadedmetadata", onLoaded, { once: true });
    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    return () => {
      try {
        el.removeEventListener("loadedmetadata", onLoaded as any);
        el.removeEventListener("canplay", onCanPlay as any);
        el.removeEventListener("waiting", onWaiting as any);
        el.removeEventListener("timeupdate", onTime as any);
        el.removeEventListener("loadedmetadata", onMeta as any);
      } catch {}
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
        setPlayError(null);
        // After user gesture, enable audio by default
        try { el.muted = false; setIsMuted(false); } catch {}
      } catch (e) {
        setPlayError('blocked');
      }
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

  const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black z-[100000]" style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}>
      {/* Header */}
      <div className="absolute top-[env(safe-area-inset-top)] left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
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
        className={`w-[100vw] h-[100dvh] ${isVertical ? 'object-cover' : 'object-cover'}`}
        autoPlay
        muted
        playsInline
        webkit-playsinline="true"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{ backgroundColor: "black", position: 'fixed', inset: 0 }}
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between pointer-events-auto">
        <button onClick={togglePlay} className="text-white px-4 py-2 bg-white/10 rounded">
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button onClick={toggleMute} className="text-white px-4 py-2 bg-white/10 rounded">
          {isMuted ? "Unmute" : "Mute"}
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-16 left-0 right-0 px-4"
        onMouseDown={(e) => {
          const el = videoRef.current; if (!el) return; setIsSeeking(true);
          const rect = (e.currentTarget.firstChild as HTMLElement).getBoundingClientRect();
          const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
          const time = (x / rect.width) * (duration || 0);
          el.currentTime = time; setCurrentTime(time);
        }}
        onMouseMove={(e) => {
          if (!isSeeking) return; const el = videoRef.current; if (!el) return;
          const rect = (e.currentTarget.firstChild as HTMLElement).getBoundingClientRect();
          const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
          const time = (x / rect.width) * (duration || 0);
          el.currentTime = time; setCurrentTime(time);
        }}
        onMouseUp={() => setIsSeeking(false)}
        onTouchStart={(e) => {
          const el = videoRef.current; if (!el) return; setIsSeeking(true);
          const touch = e.touches[0]; const rect = (e.currentTarget.firstChild as HTMLElement).getBoundingClientRect();
          const x = Math.min(Math.max(touch.clientX - rect.left, 0), rect.width);
          const time = (x / rect.width) * (duration || 0);
          el.currentTime = time; setCurrentTime(time);
        }}
        onTouchMove={(e) => {
          if (!isSeeking) return; const el = videoRef.current; if (!el) return;
          const touch = e.touches[0]; const rect = (e.currentTarget.firstChild as HTMLElement).getBoundingClientRect();
          const x = Math.min(Math.max(touch.clientX - rect.left, 0), rect.width);
          const time = (x / rect.width) * (duration || 0);
          el.currentTime = time; setCurrentTime(time);
        }}
        onTouchEnd={() => setIsSeeking(false)}
      >
        <div className="w-full h-2 bg-white/20 rounded-full">
          <div className="h-2 bg-white rounded-full" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-white/70 text-xs">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Center play prompt if not playing; full-screen hit target */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={togglePlay}
            onTouchStart={togglePlay}
            className="pointer-events-auto text-white w-[70vw] max-w-[320px] px-6 py-4 bg-white/10 rounded-full border border-white/30 text-base"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Tap to Play
          </button>
        </div>
      )}

      {/* Optional debug message */}
      {playError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 text-xs text-white/70">
          {playError === 'blocked' ? 'Autoplay blocked. Tap the button to start.' : ''}
        </div>
      )}

      {/* Loader while buffering */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number) {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}


