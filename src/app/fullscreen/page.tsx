"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FSItem = {
  id?: string;
  type: 'video' | 'photo';
  url: string;
  title?: string;
  thumbnail?: string | null;
};

interface FSPayload {
  items: FSItem[];
  startIndex?: number;
  title?: string;
}

export default function FullscreenPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [payload, setPayload] = useState<FSPayload | null>(null);
  const [index, setIndex] = useState(0);
  const [isVertical, setIsVertical] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Try sessionStorage first
    try {
      const raw = sessionStorage.getItem('fullscreen-payload');
      if (raw) {
        const data: FSPayload = JSON.parse(raw);
        if (data && data.items?.length) {
          setPayload(data);
          setIndex(Math.max(0, Math.min(data.items.length - 1, data.startIndex || 0)));
          return;
        }
      }
    } catch {}
    // Fallback from URL param
    try {
      const p = params?.get('p');
      if (p) {
        const decoded = JSON.parse(atob(p)) as FSPayload;
        if (decoded && decoded.items?.length) {
          setPayload(decoded);
          setIndex(Math.max(0, Math.min(decoded.items.length - 1, decoded.startIndex || 0)));
        }
      }
    } catch {}
  }, [params]);

  useEffect(() => {
    try {
      const ua = navigator.userAgent || '';
      setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);
    } catch {}
  }, []);

  const items = payload?.items || [];
  const item = items[index];

  // When item changes, set up video listeners
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !item || item.type !== 'video') return;
    setIsBuffering(true);
    setShowControls(true);
    const onLoaded = () => {
      try {
        const t = el.currentTime;
        el.currentTime = Math.max(0, t + 0.001);
        const vw = el.videoWidth || 0;
        const vh = el.videoHeight || 0;
        setIsVertical(vh > vw);
      } catch {}
      el.muted = true;
      el.play().then(() => { setIsPlaying(true); setIsBuffering(false); scheduleHideControls(); }).catch(() => { setIsPlaying(false); setIsBuffering(false); setShowControls(true); });
    };
    const onCanPlay = () => setIsBuffering(false);
    const onWaiting = () => setIsBuffering(true);
    const onTime = () => { if (!isSeeking) setCurrentTime(el.currentTime); };
    const onMeta = () => { setDuration(el.duration || 0); };
    el.addEventListener('loadedmetadata', onLoaded, { once: true });
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    return () => {
      try {
        el.removeEventListener('loadedmetadata', onLoaded as any);
        el.removeEventListener('canplay', onCanPlay as any);
        el.removeEventListener('waiting', onWaiting as any);
        el.removeEventListener('timeupdate', onTime as any);
        el.removeEventListener('loadedmetadata', onMeta as any);
      } catch {}
    };
  }, [item, isSeeking]);

  // Auto-hide controls after 2.5s of no interaction while playing
  useEffect(() => {
    if (!isPlaying) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 2500);
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [isPlaying, currentTime]);

  const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const title = useMemo(() => item?.title || payload?.title || 'Media', [item, payload]);

  const close = () => {
    const el = videoRef.current;
    try { el?.pause(); } catch {}
    router.back();
  };

  const next = () => setIndex((i) => (i + 1) % items.length);
  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);

  const togglePlay = async () => {
    const el = videoRef.current; if (!el) return;
    if (el.paused) {
      try { await el.play(); setIsPlaying(true); el.muted = false; setIsMuted(false); scheduleHideControls(); } catch { setShowControls(true); }
    } else { el.pause(); setIsPlaying(false); setShowControls(true); }
  };

  const toggleMute = () => {
    const el = videoRef.current; if (!el) return;
    el.muted = !el.muted; setIsMuted(el.muted);
  };

  if (!payload || !item) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
        <div>Loading…</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black z-[100000]"
      style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
      onMouseMove={() => { setShowControls(true); scheduleHideControls(); }}
      onTouchMove={() => { setShowControls(true); scheduleHideControls(); }}
      onClick={() => { if (item.type === 'video') { setShowControls(true); scheduleHideControls(); } }}
    >
      {/* Header */}
      <div className={`absolute top-[env(safe-area-inset-top)] left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={close} className="text-white px-3 py-2 bg-white/10 rounded">Done</button>
        <div className="text-white text-sm truncate max-w-[60%]">{title}</div>
        <div className="w-16" />
      </div>

      {/* Main */}
      <div className="absolute inset-0">
        {item.type === 'photo' ? (
          <img src={item.url} alt={item.title || ''} className="w-[100vw] h-[100dvh] object-contain" />
        ) : (
          <video
            ref={videoRef}
            src={item.url}
            poster={item.thumbnail || '/placeholder-thumbnail.jpg'}
            className={`w-[100vw] h-[100dvh] ${isVertical ? 'object-cover' : 'object-cover'}`}
            autoPlay
            muted
            playsInline
            webkit-playsinline="true"
            disablePictureInPicture
            controlsList="nodownload noremoteplayback nofullscreen"
            controls={isIOS}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{ backgroundColor: 'black', position: 'fixed', inset: 0, pointerEvents: 'auto' }}
            onClick={(e) => { if (!isIOS) { e.stopPropagation(); togglePlay(); } }}
          />
        )}
      </div>

      {/* Arrows */}
      {items.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 rounded-full text-white">◀</button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 rounded-full text-white">▶</button>
        </>
      )}

      {/* Controls if video */}
      {item.type === 'video' && !isIOS && (
        <>
          <div className={`absolute bottom-[max(env(safe-area-inset-bottom),0px)] left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between pointer-events-auto transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'} z-40`}>
            <button onClick={togglePlay} className="text-white px-4 py-2 bg-white/10 rounded">{isPlaying ? 'Pause' : 'Play'}</button>
            <button onClick={toggleMute} className="text-white px-4 py-2 bg-white/10 rounded">{isMuted ? 'Unmute' : 'Mute'}</button>
          </div>
          <div
            className={`absolute left-0 right-0 px-4 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'} z-40`}
            style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
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
        </>
      )}

      {/* Buffering */}
      {item.type === 'video' && isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Center Tap-to-Play overlay when not playing */}
      {item.type === 'video' && !isPlaying && !isIOS && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button onClick={togglePlay} onTouchStart={togglePlay} className="text-white w-[70vw] max-w-[320px] px-6 py-4 bg-white/10 rounded-full border border-white/30 text-base">
            Tap to Play
          </button>
        </div>
      )}

      {/* Hide the native fullscreen button on iOS controls */}
      <style jsx global>{`
        video::-webkit-media-controls-fullscreen-button { display: none !important; }
        video::-webkit-media-controls-download-button { display: none !important; }
      `}</style>
    </div>
  );
}

function formatTime(seconds: number) {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function scheduleHideControls() {
  // Placeholder for call sites migrated to use useEffect-based auto-hide
}


