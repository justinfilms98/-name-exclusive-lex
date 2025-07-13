"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface VideoPlayerProps {
  src: string;
  title: string;
  expiresAt?: string;
}

export default function VideoPlayer({ src, title, expiresAt }: VideoPlayerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        router.push('/account');
      } else {
        setTimeLeft(Math.ceil(ms / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, router]);

  function formatCountdown(seconds: number | null) {
    if (seconds === null) return '';
    if (seconds <= 0) return 'Expired';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#D4C7B4' }}>
      <h1 className="text-3xl font-bold mb-6 text-center text-[#654C37]">{title}</h1>
      {expiresAt && (
        <div className="mb-4 text-lg text-emerald-700 font-semibold">Access expires in: {formatCountdown(timeLeft)}</div>
      )}
      <div style={{ position: 'relative', width: '100vw', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <video
          controls
          style={{ width: '100vw', height: '80vh', objectFit: 'contain', background: 'black', userSelect: 'none', WebkitUserSelect: 'none', msUserSelect: 'none', MozUserSelect: 'none', pointerEvents: 'auto' }}
          src={src}
          className="rounded-lg shadow-lg select-none"
          controlsList="nodownload noremoteplayback nofullscreen"
          disablePictureInPicture
          disableRemotePlayback
          onContextMenu={e => e.preventDefault()}
          onDragStart={e => e.preventDefault()}
        />
        {session?.user?.email && (
          <div style={{
            position: 'absolute',
            bottom: 10,
            right: 20,
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            pointerEvents: 'none',
            zIndex: 10,
            userSelect: 'none',
          }}>
            {session.user.email}
          </div>
        )}
      </div>
    </div>
  );
} 