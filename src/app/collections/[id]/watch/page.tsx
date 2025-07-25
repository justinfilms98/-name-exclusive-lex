"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, getCollection, checkAccess, getSignedUrl, logWatchActivity } from '@/lib/supabase';

export default function WatchPage() {
  const [user, setUser] = useState<any>(null);
  const [collection, setCollection] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const id = params?.id as string;

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        console.log('=== WATCH PAGE DEBUG START ===');
        console.log('Starting checkUserAccess for collection:', id);
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('No session found, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('User session found:', session.user.email);
        setUser(session.user);

        // Get collection details
        console.log('Fetching collection data for ID:', id);
        const { data: collectionData, error: collectionError } = await getCollection(id);
        if (collectionError || !collectionData) {
          console.error('Collection error:', collectionError);
          setError('Collection not found');
          setLoading(false);
          return;
        }

        console.log('Collection data loaded:', collectionData);
        console.log('Collection photo_paths:', collectionData.photo_paths);
        console.log('Photo paths type:', typeof collectionData.photo_paths);
        console.log('Photo paths is array:', Array.isArray(collectionData.photo_paths));

        setCollection(collectionData);

        // Check if user has access
        const { data: accessData, error: accessError } = await checkAccess(session.user.id, id);
        if (accessError || !accessData) {
          setError('Access denied. Please purchase this collection first.');
          setLoading(false);
          return;
        }

        setHasAccess(true);

        // Calculate time remaining
        const expiresAt = new Date(accessData.expires_at);
        const now = new Date();
        const remaining = Math.max(0, expiresAt.getTime() - now.getTime());
        setTimeRemaining(Math.floor(remaining / 1000));

        if (remaining <= 0) {
          setError('Your access to this content has expired.');
          setLoading(false);
          return;
        }

        // Get signed URLs for content
        const { data: videoSignedUrl, error: videoError } = await getSignedUrl('media', collectionData.video_path, 3600);
        if (videoError || !videoSignedUrl) {
          setError('Failed to load video content');
          setLoading(false);
          return;
        }

        setVideoUrl(videoSignedUrl.signedUrl);

        // Get signed URLs for photos if they exist
        if (collectionData.photo_paths && collectionData.photo_paths.length > 0) {
          console.log('Loading photos from paths:', collectionData.photo_paths);
          console.log('Photo paths type:', typeof collectionData.photo_paths);
          console.log('Photo paths length:', collectionData.photo_paths.length);
          
          const photoPromises = collectionData.photo_paths.map(async (path: string, index: number) => {
            try {
              console.log(`Loading photo ${index + 1}:`, path);
              console.log(`Photo path type:`, typeof path);
              console.log(`Photo path length:`, path.length);
              
              const { data, error } = await getSignedUrl('media', path, 3600);
              if (error) {
                console.error(`Failed to load photo ${index + 1}:`, error);
                console.error(`Error details:`, error.message);
                return null;
              }
              console.log(`Successfully loaded photo ${index + 1}:`, data?.signedUrl);
              return data?.signedUrl;
            } catch (err) {
              console.error(`Error loading photo ${index + 1}:`, err);
              return null;
            }
          });

          const urls = await Promise.all(photoPromises);
          const validUrls = urls.filter(Boolean) as string[];
          console.log('Valid photo URLs loaded:', validUrls.length);
          console.log('Valid URLs:', validUrls);
          setPhotoUrls(validUrls);
        } else {
          console.log('No photo paths found in collection data');
          console.log('Collection data keys:', Object.keys(collectionData));
          console.log('Photo paths value:', collectionData.photo_paths);
        }

        // Log the watch activity
        await logWatchActivity({
          user_id: session.user.id,
          collection_id: id,
          purchase_id: accessData.id,
          created_at: new Date().toISOString(),
        });

        setLoading(false);

      } catch (err: any) {
        console.error('Access check error:', err);
        setError('Failed to verify access');
        setLoading(false);
      }
    };

    if (id) {
      checkUserAccess();
    }
  }, [id, router]);

  // Timer countdown - only start when user starts watching
  useEffect(() => {
    if (timeRemaining > 0 && timerStarted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setError('Your access has expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, timerStarted]);

  // Handle video events
  const handleVideoLoad = () => {
    setVideoLoaded(true);
  };

  const handlePlay = () => {
    console.log('Video play event triggered');
    setIsPlaying(true);
    if (!timerStarted) {
      setTimerStarted(true);
    }
  };

  const handlePause = () => {
    console.log('Video pause event triggered');
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
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

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const openPhotoFullscreen = (photoUrl: string) => {
    setFullscreenPhoto(photoUrl);
    setIsFullscreen(true);
  };

  const closePhotoFullscreen = () => {
    setFullscreenPhoto(null);
    setIsFullscreen(false);
  };

  const handlePhotoClick = (photoUrl: string) => {
    openPhotoFullscreen(photoUrl);
  };

  const handlePhotoDoubleClick = (photoUrl: string) => {
    openPhotoFullscreen(photoUrl);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRemainingTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  // Prevent right-click and other protection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C')
      ) {
        e.preventDefault();
      }
      
      // Close fullscreen photo on Escape
      if (e.key === 'Escape' && fullscreenPhoto) {
        closePhotoFullscreen();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullscreenPhoto]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading exclusive content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/collections')}
            className="bg-white text-black px-6 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess || !videoUrl) {
    return null;
  }

  console.log('Rendering watch page - photoUrls.length:', photoUrls.length);
  console.log('Collection photo_paths:', collection?.photo_paths);

  return (
    <div className="min-h-screen bg-black">
      {/* Header with timer */}
      <div className="bg-black bg-opacity-75 text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
        <div>
          <h1 className="text-lg font-semibold">{collection?.title}</h1>
          <p className="text-sm text-gray-300">Exclusive Content</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-300">Time Remaining</p>
          <p className="text-lg font-mono text-red-400">{formatRemainingTime(timeRemaining)}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20">
        {/* Video Player */}
        <div 
          className="relative bg-black"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            if (isPlaying) {
              setShowControls(false);
            }
          }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-screen object-contain"
            onContextMenu={(e) => e.preventDefault()}
            onLoadedData={handleVideoLoad}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            style={{
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              userSelect: 'none',
            }}
          >
            Your browser does not support the video tag.
          </video>

          {/* Loading overlay */}
          {!videoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}

          {/* Custom Video Controls */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
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
                  onClick={handleVideoClick}
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
                {user?.email} • Exclusive Access
              </div>
            </div>
          </div>
        </div>

        {/* Additional Photos */}
        {photoUrls.length > 0 && (
          <div className="bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
              <h3 className="text-white text-2xl font-semibold mb-6 text-center">
                Additional Content ({photoUrls.length} photos)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                      <img
                        src={url}
                        alt={`Content ${index + 1}`}
                        className="w-full h-64 object-cover"
                        onContextMenu={(e) => e.preventDefault()}
                        onClick={() => handlePhotoClick(url)}
                        onDoubleClick={() => handlePhotoDoubleClick(url)}
                        onError={(e) => {
                          console.error(`Failed to load photo ${index + 1}:`, e);
                          e.currentTarget.style.display = 'none';
                        }}
                        style={{
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none',
                          userSelect: 'none',
                        }}
                      />
                      {/* Photo number overlay */}
                      <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs font-medium">
                        Photo {index + 1}
                      </div>
                      
                      {/* Fullscreen button overlay */}
                      <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white p-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Collection info card */}
              <div className="mt-8 bg-white rounded-lg p-6 shadow-lg">
                <h4 className="text-gray-800 text-lg font-semibold mb-2">Collection Video</h4>
                <p className="text-gray-600 mb-2">Your exclusive content is now playing.</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Purchased: {new Date().toLocaleDateString()}</span>
                  <span>Time remaining: {formatRemainingTime(timeRemaining)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No photos message */}
        {photoUrls.length === 0 && collection?.photo_paths?.length > 0 && (
          <div className="bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto text-center">
              <h3 className="text-white text-2xl font-semibold mb-4">
                Additional Content
              </h3>
              <p className="text-gray-300 mb-4">
                {collection.photo_paths.length} photos available but failed to load
              </p>
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h4 className="text-gray-800 text-lg font-semibold mb-2">Collection Video</h4>
                <p className="text-gray-600 mb-2">Your exclusive content is now playing.</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Purchased: {new Date().toLocaleDateString()}</span>
                  <span>Time remaining: {formatRemainingTime(timeRemaining)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-8 text-white text-sm">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            <p>Collection ID: {id}</p>
            <p>Photo paths in collection: {collection?.photo_paths?.length || 0}</p>
            <p>Photos loaded: {photoUrls.length}</p>
            <p>User: {user?.email}</p>
            <p>Video loaded: {videoLoaded ? 'Yes' : 'No'}</p>
            <p>Timer started: {timerStarted ? 'Yes' : 'No'}</p>
            <p>Is playing: {isPlaying ? 'Yes' : 'No'}</p>
            <p>Current time: {formatTime(currentTime)}</p>
            <p>Duration: {formatTime(duration)}</p>
          </div>
        )}

        {/* Fullscreen Photo Modal */}
        {fullscreenPhoto && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
            onClick={closePhotoFullscreen}
          >
            <div className="relative max-w-full max-h-full p-4">
              <img
                src={fullscreenPhoto}
                alt="Fullscreen content"
                className="max-w-full max-h-full object-contain"
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  userSelect: 'none',
                }}
              />
              
              {/* Close button */}
              <button
                onClick={closePhotoFullscreen}
                className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded-full hover:bg-opacity-100 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
              
              {/* Watermark */}
              <div className="absolute bottom-4 left-4 text-white text-opacity-50 text-sm">
                {user?.email} • Exclusive Access
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 