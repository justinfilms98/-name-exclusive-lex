"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, getCollection, checkAccess, getSignedUrl, logWatchActivity } from '@/lib/supabase';
import PurchaseLegalDisclaimer from '@/components/PurchaseLegalDisclaimer';

export default function WatchPage() {
  const [user, setUser] = useState<any>(null);
  const [collection, setCollection] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showLegalDisclaimer, setShowLegalDisclaimer] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  
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
        setCollection(collectionData);

        // Check if user has access
        const { data: accessData, error: accessError } = await checkAccess(session.user.id, id);
        if (accessError || !accessData) {
          setError('Access denied. Please purchase this collection first.');
          setLoading(false);
          return;
        }

        setHasAccess(true);

        // Get protected video URL through our API
        console.log('🔍 DEBUG: Calling protected-video API with session_id:', accessData.stripe_session_id);
        const videoRes = await fetch(`/api/protected-video?session_id=${accessData.stripe_session_id}`);
        console.log('🔍 DEBUG: Protected video API response status:', videoRes.status);
        const videoJson = await videoRes.json();
        console.log('🔍 DEBUG: Protected video API response:', videoJson);
        
        if (!videoRes.ok || !videoJson.videoUrl) {
          console.error('Failed to get protected video URL:', videoJson);
          setError('Failed to load video content');
          setLoading(false);
          return;
        }

        // Get signed URL for the video path
        console.log('🔍 DEBUG: Getting signed URL for video path:', videoJson.videoUrl);
        const { data: videoSignedUrl, error: videoError } = await getSignedUrl('media', videoJson.videoUrl, 3600);
        console.log('🔍 DEBUG: Signed URL result:', videoSignedUrl);
        console.log('🔍 DEBUG: Signed URL error:', videoError);
        
        if (videoError || !videoSignedUrl) {
          console.error('Failed to get signed URL for video:', videoError);
          setError('Failed to load video content');
          setLoading(false);
          return;
        }

        console.log('🔍 DEBUG: Setting video URL to:', videoSignedUrl.signedUrl);
        setVideoUrl(videoSignedUrl.signedUrl);

        // Get signed URLs for photos if they exist
        if (collectionData.photo_paths && collectionData.photo_paths.length > 0) {
          console.log('Loading photos from paths:', collectionData.photo_paths);
          
          const photoPromises = collectionData.photo_paths.map(async (path: string, index: number) => {
            try {
              console.log(`Loading photo ${index + 1}:`, path);
              const { data, error } = await getSignedUrl('media', path, 3600);
              if (error) {
                console.error(`Failed to load photo ${index + 1}:`, error);
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
          setPhotoUrls(validUrls);
        }

        // Log the watch activity
        await logWatchActivity({
          user_id: session.user.id,
          collection_id: id,
          purchase_id: accessData.id,
          created_at: new Date().toISOString(),
        });

        // Check if user has accepted purchase terms
        const hasAcceptedPurchaseTerms = localStorage.getItem('exclusive-lex-purchase-terms-accepted') === 'true';
        
        if (!hasAcceptedPurchaseTerms) {
          setShowLegalDisclaimer(true);
        } else {
          setContentReady(true);
        }

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

  // Handle video URL changes
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      console.log('🔍 DEBUG: Video URL changed, updating video element');
      console.log('New video URL:', videoUrl);
      
      setVideoLoading(true);
      setVideoError(null);
      
      // Force the video element to reload
      videoRef.current.load();
      
      // Add a small delay to ensure the video element is ready
      setTimeout(() => {
        if (videoRef.current) {
          console.log('🔍 DEBUG: Video element after load:', {
            src: videoRef.current.src,
            readyState: videoRef.current.readyState,
            networkState: videoRef.current.networkState,
            error: videoRef.current.error
          });
        }
      }, 1000);
    }
  }, [videoUrl]);

  // Handle video events
  const handleVideoLoad = () => {
    console.log('✅ Video loaded successfully');
    setVideoLoading(false);
    setVideoError(null);
  };

  const handleVideoError = (e: any) => {
    console.error('❌ Video loading error:', e);
    setVideoError('⚠️ Failed to load video. Please try again.');
    setVideoLoading(false);
  };

  const handlePlay = () => {
    console.log('Video play event triggered');
    setIsPlaying(true);
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLegalAccept = () => {
    setShowLegalDisclaimer(false);
    setContentReady(true);
  };

  const handleLegalDecline = () => {
    setShowLegalDisclaimer(false);
    router.push('/collections');
  };

  // Prevent right-click and other protection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C')
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  // Show legal disclaimer if needed
  if (showLegalDisclaimer) {
    return (
      <PurchaseLegalDisclaimer
        onAccept={handleLegalAccept}
        onDecline={handleLegalDecline}
      />
    );
  }

  // Only show content when ready
  if (!contentReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Preparing your content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black bg-opacity-75 text-white p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50">
        <div>
          <h1 className="text-lg font-semibold">{collection?.title}</h1>
          <p className="text-sm text-gray-300">Exclusive Content</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-300">Permanent Access</p>
          <p className="text-lg font-mono text-green-400">✓ Active</p>
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
          {/* Loading overlay */}
          {videoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {videoError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
              <div className="text-center text-white max-w-md mx-4">
                <div className="text-red-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Video Error</h2>
                <p className="text-gray-300 mb-6">{videoError}</p>
                <button
                  onClick={() => {
                    setVideoLoading(true);
                    setVideoError(null);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                  className="bg-white text-black px-6 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            key={videoUrl}
            src={videoUrl}
            className="w-full h-screen object-contain"
            onContextMenu={(e) => e.preventDefault()}
            onError={handleVideoError}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onLoadedData={handleVideoLoad}
            onEnded={() => setIsPlaying(false)}
            preload="metadata"
            controls={false}
            playsInline
            muted
            crossOrigin="anonymous"
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 