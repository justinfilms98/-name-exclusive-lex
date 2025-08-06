import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function WatchVideoPage() {
  const router = useRouter();
  const { videoId } = router.query;
  const [email, setEmail] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  async function handleAccess() {
    setLoading(true);
    setError('');
    setVideoUrl('');
    try {
      const res = await fetch(`/api/secure-video?videoId=${videoId}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Access denied');
      setVideoUrl(data.signedUrl);
    } catch (err: any) {
      setError(err.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  }

  // Handle fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    }
  };

  return (
    <div 
      className="min-h-screen bg-black"
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      <div className="max-w-4xl mx-auto p-4">
        <h2 className="text-white text-2xl font-semibold mb-4">Watch Video</h2>
        
        {!videoUrl ? (
          <div className="bg-white rounded-lg p-6">
            <input
              type="email"
              placeholder="Enter your email to access"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded mb-4"
            />
            <button 
              onClick={handleAccess} 
              disabled={loading || !email}
              className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Checking...' : 'Access Video'}
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="relative bg-black rounded-lg overflow-hidden"
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-auto"
              onContextMenu={(e) => e.preventDefault()}
              autoPlay
              muted
              playsInline
              style={{
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                userSelect: 'none',
              }}
            >
              Your browser does not support the video tag.
            </video>

            {/* Fullscreen Button */}
            <div className="absolute bottom-4 right-4 z-20">
              <button
                onClick={toggleFullscreen}
                className="bg-black bg-opacity-75 text-white p-3 rounded-lg hover:bg-opacity-90 transition-all duration-200 flex items-center space-x-2"
                title="Toggle Fullscreen (F)"
              >
                {isFullscreen ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                    </svg>
                    <span className="text-sm">Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                    </svg>
                    <span className="text-sm">Fullscreen</span>
                  </>
                )}
              </button>
            </div>

            {/* Watermark */}
            <div className="absolute bottom-4 left-4 z-20">
              <div className="text-white text-opacity-50 text-sm bg-black bg-opacity-75 px-3 py-2 rounded-lg">
                {email} • Exclusive Access
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 