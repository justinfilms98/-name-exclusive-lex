"use client";

interface VideoPlayerProps {
  src: string;
  title: string;
}

export default function VideoPlayer({ src, title }: VideoPlayerProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#D4C7B4' }}>
      <h1 className="text-3xl font-bold mb-6 text-center text-[#654C37]">{title}</h1>
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
    </div>
  );
} 