import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function WatchVideoPage() {
  const router = useRouter();
  const { videoId } = router.query;
  const [email, setEmail] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black">
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
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-auto"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              onMouseMove={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                userSelect: 'none',
              }}
            >
              Your browser does not support the video tag.
            </video>

            {/* Custom Video Controls */}
            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300">
                {/* Progress Bar */}
                <div 
                  className="w-full h-1 bg-gray-600 rounded-full cursor-pointer mb-4"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="h-full bg-red-500 rounded-full relative"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Play/Pause Button */}
                    <button
                      onClick={handlePlayPause}
                      className="text-white hover:text-gray-300 transition-colors"
                    >
                      {isPlaying ? (
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                      ) : (
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </button>

                    {/* Time Display */}
                    <div className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>

                  {/* Watermark */}
                  <div className="text-white text-opacity-50 text-sm">
                    {email} • Exclusive Access
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 