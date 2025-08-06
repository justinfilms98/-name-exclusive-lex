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
  const [showLegalDisclaimer, setShowLegalDisclaimer] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [videoFullscreen, setVideoFullscreen] = useState(false);
  const [photoFullscreen, setPhotoFullscreen] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const id = params?.id as string;

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
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
        console.log('Calling protected-video API with session_id:', accessData.stripe_session_id);
        const videoRes = await fetch(`/api/protected-video?session_id=${accessData.stripe_session_id}`);
        console.log('Protected video API response status:', videoRes.status);
        const videoJson = await videoRes.json();
        
        if (!videoRes.ok || !videoJson.videoUrl) {
          console.error('Failed to get protected video URL:', videoJson);
          setError('Failed to load video content');
          setLoading(false);
          return;
        }

        // Get signed URL for the video path
        console.log('Getting signed URL for video path:', videoJson.videoUrl);
        const { data: videoSignedUrl, error: videoError } = await getSignedUrl('media', videoJson.videoUrl, 3600);
        
        if (videoError || !videoSignedUrl) {
          console.error('Failed to get signed URL for video:', videoError);
          setError('Failed to load video content');
          setLoading(false);
          return;
        }

        console.log('Setting video URL to:', videoSignedUrl.signedUrl);
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
        
        // TEMPORARY: Bypass DMCA check to get watch page working
        const bypassDMCA = true; // Set to false to re-enable DMCA check
        
        // If user has access to this collection, they should be able to view it
        // Only show DMCA if they haven't accepted terms AND this is their first time accessing purchased content
        if (!hasAcceptedPurchaseTerms && !bypassDMCA) {
          console.log('Showing legal disclaimer - first time access');
          setShowLegalDisclaimer(true);
        } else {
          console.log('Terms already accepted or bypassed, setting content ready');
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
      console.log('Video URL changed, updating video element');
      console.log('New video URL:', videoUrl);
      
      setVideoLoading(true);
      setVideoError(null);
      
      // Force the video element to reload
      videoRef.current.load();
      
      // Add a small delay to ensure the video element is ready
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Video element after load:', {
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
    console.log('Video loaded successfully');
    setVideoLoading(false);
  };

  const handleVideoError = (e: any) => {
    console.error('Video loading error:', e);
    setVideoError('Failed to load video content. Please try refreshing the page.');
    setVideoLoading(false);
  };

  const handleVideoDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleVideoFullscreen();
  };

  const toggleVideoFullscreen = () => {
    if (!videoContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        videoContainerRef.current.requestFullscreen().then(() => {
          setVideoFullscreen(true);
        }).catch((err) => {
          console.error('Fullscreen request failed:', err);
        });
      } else {
        document.exitFullscreen().then(() => {
          setVideoFullscreen(false);
        }).catch((err) => {
          console.error('Exit fullscreen failed:', err);
        });
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const handleVideoFullscreenButton = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleVideoFullscreen();
  };

  const openPhotoFullscreen = (photoUrl: string) => {
    // Don't open photo fullscreen if video is in fullscreen
    if (videoFullscreen) {
      return;
    }
    
    setFullscreenPhoto(photoUrl);
    setPhotoFullscreen(true);
  };

  const closePhotoFullscreen = () => {
    console.log('🔍 DEBUG: Closing photo fullscreen');
    setFullscreenPhoto(null);
    setPhotoFullscreen(false);
  };

  const handleLegalAccept = () => {
    localStorage.setItem('exclusive-lex-purchase-terms-accepted', 'true');
    setShowLegalDisclaimer(false);
    setContentReady(true);
  };

  const handleLegalDecline = () => {
    router.push('/collections');
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleVideoFullscreen();
      }
      // Handle escape key for custom fullscreen
      if (e.key === 'Escape' && videoFullscreen) {
        console.log('🔍 DEBUG: Escape key pressed, exiting fullscreen');
        setVideoFullscreen(false);
        
        // Restore everything
        const video = videoRef.current;
        const container = videoContainerRef.current;
        
        if (container) {
          container.style.position = '';
          container.style.top = '';
          container.style.left = '';
          container.style.width = '';
          container.style.height = '';
          container.style.zIndex = '';
          container.style.backgroundColor = '';
          container.style.display = '';
          container.style.alignItems = '';
          container.style.justifyContent = '';
          container.style.padding = '';
          container.style.margin = '';
        }
        
        if (video) {
          video.style.width = '';
          video.style.height = '';
          video.style.objectFit = '';
          video.style.maxWidth = '';
          video.style.maxHeight = '';
        }
        
        // Restore body
        document.body.style.overflow = '';
        document.body.style.margin = '';
        document.body.style.padding = '';
      }
    };

    const handleFullscreenChange = () => {
      // setIsFullscreen(!!document.fullscreenElement); // This state variable is no longer used
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [videoFullscreen]);

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
    console.log('Render - No access or no video URL. hasAccess:', hasAccess, 'videoUrl:', !!videoUrl);
    return null;
  }

  // Show legal disclaimer if needed
  if (showLegalDisclaimer) {
    console.log('Render - Showing legal disclaimer');
    return (
      <PurchaseLegalDisclaimer
        onAccept={handleLegalAccept}
        onDecline={handleLegalDecline}
      />
    );
  }

  // Only show content when ready
  if (!contentReady) {
    console.log('Render - Content not ready, showing loading');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p>Preparing your content...</p>
        </div>
      </div>
    );
  }

  console.log('Render - Showing video content');

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
          ref={videoContainerRef}
          className={`relative bg-black ${videoFullscreen ? 'fixed inset-0 z-50' : ''}`}
          style={videoFullscreen ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            overflow: 'hidden'
          } : {}}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-screen object-contain"
            onContextMenu={(e) => e.preventDefault()}
            onError={handleVideoError}
            onLoadedData={handleVideoLoad}
            onDoubleClick={handleVideoDoubleClick}
            preload="metadata"
            controls={false}
            autoPlay
            muted
            playsInline
            crossOrigin="anonymous"
          >
            Your browser does not support the video tag.
          </video>

          {/* Fullscreen Button */}
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={handleVideoFullscreenButton}
              onTouchEnd={handleVideoFullscreenButton}
              className="text-white hover:text-gray-300 transition-colors touch-manipulation bg-black bg-opacity-75 p-3 rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
              title="Toggle fullscreen (F key or double-click video)"
            >
              {videoFullscreen ? (
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
              {user?.email} • Exclusive Access
            </div>
          </div>

          {/* Video Fullscreen Hint (only when not in fullscreen) */}
          {!videoFullscreen && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
                Double-click to enter fullscreen
              </div>
            </div>
          )}

          {/* Fullscreen Exit Hint */}
          {videoFullscreen && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
              Press ESC or double-click to exit fullscreen
            </div>
          )}
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
                    <div 
                      className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                      onClick={() => openPhotoFullscreen(url)}
                    >
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
                      {/* Fullscreen icon overlay */}
                      <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white p-1 rounded">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Photo Fullscreen Modal */}
        {photoFullscreen && fullscreenPhoto && !videoFullscreen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-95 z-40 flex items-center justify-center"
            onClick={closePhotoFullscreen}
          >
            <div className="relative max-w-full max-h-full p-4">
              <img
                src={fullscreenPhoto}
                alt="Fullscreen photo"
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
                className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded-full hover:bg-opacity-100 transition-all"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 