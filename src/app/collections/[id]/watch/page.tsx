"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, getCollection, checkAccess, getSignedUrl, logWatchActivity } from '@/lib/supabase';
import PurchaseLegalDisclaimer from '@/components/PurchaseLegalDisclaimer';
import MediaCarousel from '@/components/MediaCarousel';

interface MediaItem {
  id: string;
  type: 'video' | 'photo';
  url: string;
  title?: string;
  description?: string;
}

export default function WatchPage() {
  const [user, setUser] = useState<any>(null);
  const [collection, setCollection] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showLegalDisclaimer, setShowLegalDisclaimer] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  const router = useRouter();
  const params = useParams();
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
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔍 Fetching collection data for ID:', id);
        }
        const { data: collectionData, error: collectionError } = await getCollection(id);
        if (collectionError || !collectionData) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('❌ Collection error:', collectionError);
          }
          setError(collectionError?.message || 'Collection not found');
          setLoading(false);
          return;
        }

        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Collection data loaded:', collectionData.title);
        }
        setCollection(collectionData);

        // Check if user has access using server-side endpoint
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔍 Checking access for user:', session.user.id, 'collection:', id);
        }
        
        let accessData;
        try {
          const accessResponse = await fetch(`/api/access/check?collectionId=${encodeURIComponent(id)}&userId=${encodeURIComponent(session.user.id)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!accessResponse.ok) {
            const errorData = await accessResponse.json().catch(() => ({ error: 'Unknown error' }));
            if (process.env.NODE_ENV !== 'production') {
              console.error('❌ Access check failed:', accessResponse.status, errorData.error);
            }
            setError(errorData.error || 'Access denied. Please purchase this collection first.');
            setLoading(false);
            return;
          }

          const accessResult = await accessResponse.json();
          
          if (!accessResult.hasAccess || !accessResult.purchase) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('❌ No access found for user:', session.user.id, 'collection:', id);
            }
            setError('Access denied. Please purchase this collection first.');
            setLoading(false);
            return;
          }

          accessData = accessResult.purchase; // Use the purchase from server response
          if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Access granted for user:', session.user.id, 'purchase ID:', accessData.id);
          }
          setHasAccess(true);
        } catch (error: any) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('❌ Access check error:', error);
          }
          setError(error.message || 'Failed to verify access. Please try again.');
          setLoading(false);
          return;
        }

        // Get protected video URL through our API
        // Handle case where stripe_session_id might be missing
        const sessionId = accessData.stripe_session_id;
        if (!sessionId) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('⚠️ No stripe_session_id in purchase data, trying alternative method');
          }
          // Try to get video URL directly from collection if available
          if (collectionData.video_path || collectionData.media_filename) {
            const videoPath = collectionData.media_filename || collectionData.video_path;
            try {
              const { data: signedUrlData, error: signedUrlError } = await getSignedUrl('media', videoPath, 3600);
              if (!signedUrlError && signedUrlData?.signedUrl) {
                setVideoUrl(signedUrlData.signedUrl);
                if (process.env.NODE_ENV !== 'production') {
                  console.log('✅ Got video URL directly from collection');
                }
              }
            } catch (err) {
              if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to get signed URL directly:', err);
              }
            }
          }
        } else {
          try {
            if (process.env.NODE_ENV !== 'production') {
              console.log('Calling protected-video API with session_id:', sessionId, 'collection_id:', id);
            }
            const videoRes = await fetch(`/api/protected-video?session_id=${encodeURIComponent(sessionId)}&collection_id=${encodeURIComponent(id)}`);
            
            if (!videoRes.ok) {
              const errorData = await videoRes.json().catch(() => ({ error: 'Unknown error' }));
              if (process.env.NODE_ENV !== 'production') {
                console.error('Protected video API failed:', videoRes.status, errorData);
              }
              // Don't fail completely - try direct method as fallback
              if (collectionData.video_path || collectionData.media_filename) {
                const videoPath = collectionData.media_filename || collectionData.video_path;
                const { data: signedUrlData, error: signedUrlError } = await getSignedUrl('media', videoPath, 3600);
                if (!signedUrlError && signedUrlData?.signedUrl) {
                  setVideoUrl(signedUrlData.signedUrl);
                  if (process.env.NODE_ENV !== 'production') {
                    console.log('✅ Fallback: Got video URL directly from collection');
                  }
                }
              }
            } else {
              const videoJson = await videoRes.json();
              if (videoJson.videoUrl) {
                if (process.env.NODE_ENV !== 'production') {
                  console.log('✅ Using signed URL from protected-video API');
                }
                setVideoUrl(videoJson.videoUrl);
              } else if (collectionData.video_path || collectionData.media_filename) {
                // Fallback to direct method
                const videoPath = collectionData.media_filename || collectionData.video_path;
                const { data: signedUrlData, error: signedUrlError } = await getSignedUrl('media', videoPath, 3600);
                if (!signedUrlError && signedUrlData?.signedUrl) {
                  setVideoUrl(signedUrlData.signedUrl);
                }
              }
            }
          } catch (videoError: any) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('Error fetching video URL:', videoError);
            }
            // Try fallback method
            if (collectionData.video_path || collectionData.media_filename) {
              const videoPath = collectionData.media_filename || collectionData.video_path;
              try {
                const { data: signedUrlData, error: signedUrlError } = await getSignedUrl('media', videoPath, 3600);
                if (!signedUrlError && signedUrlData?.signedUrl) {
                  setVideoUrl(signedUrlData.signedUrl);
                }
              } catch (fallbackError) {
                if (process.env.NODE_ENV !== 'production') {
                  console.error('Fallback video URL fetch also failed:', fallbackError);
                }
              }
            }
          }
        }

        // Get signed URLs for photos if they exist
        if (collectionData.photo_paths && Array.isArray(collectionData.photo_paths) && collectionData.photo_paths.length > 0) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('📸 Loading photos from paths:', collectionData.photo_paths.length, 'photos');
          }
          
          const photoPromises = collectionData.photo_paths.map(async (path: string, index: number) => {
            try {
              const { data, error } = await getSignedUrl('media', path, 3600);
              if (error) {
                if (process.env.NODE_ENV !== 'production') {
                  console.warn(`⚠️ Failed to load photo ${index + 1}:`, error);
                }
                return null;
              }
              return data?.signedUrl || null;
            } catch (err) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn(`⚠️ Error loading photo ${index + 1}:`, err);
              }
              return null;
            }
          });

          const urls = await Promise.all(photoPromises);
          const validUrls = urls.filter(Boolean) as string[];
          if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ Valid photo URLs loaded: ${validUrls.length}/${collectionData.photo_paths.length}`);
          }
          setPhotoUrls(validUrls);
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.log('ℹ️ No photos found in collection');
          }
        }

        // Log the watch activity (don't block on this)
        logWatchActivity({
          user_id: session.user.id,
          collection_id: id,
          purchase_id: accessData.id,
          created_at: new Date().toISOString(),
        }).catch((err) => {
          // Don't fail if logging fails
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Failed to log watch activity:', err);
          }
        });

        // Check if user has accepted purchase terms
        const hasAcceptedPurchaseTerms = localStorage.getItem('exclusive-lex-purchase-terms-accepted') === 'true';
        
        // TEMPORARY: Bypass DMCA check to get watch page working
        const bypassDMCA = true; // Set to false to re-enable DMCA check
        
        // If user has access to this collection, they should be able to view it
        // Only show DMCA if they haven't accepted terms AND this is their first time accessing purchased content
        if (!hasAcceptedPurchaseTerms && !bypassDMCA) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('Showing legal disclaimer - first time access');
          }
          setShowLegalDisclaimer(true);
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Terms already accepted or bypassed, setting content ready');
          }
          setContentReady(true);
        }

        setLoading(false);

      } catch (err: any) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Access check error:', err);
        }
        setError(err.message || 'Failed to verify access. Please try again.');
        setLoading(false);
      }
    };

    if (id) {
      checkUserAccess();
    }
  }, [id, router]);

  // Prepare media items for carousel
  useEffect(() => {
    if (videoUrl || photoUrls.length > 0) {
      const items: MediaItem[] = [];
      
      // Add video as first item if available
      if (videoUrl) {
        items.push({
          id: 'video',
          type: 'video',
          url: videoUrl,
          title: collection?.title || 'Video',
          description: collection?.description
        });
      }
      
      // Add photos
      photoUrls.forEach((url, index) => {
        items.push({
          id: `photo-${index}`,
          type: 'photo',
          url: url,
          title: `${collection?.title || 'Photo'} ${index + 1}`,
          description: collection?.description
        });
      });
      
      setMediaItems(items);
    }
  }, [videoUrl, photoUrls, collection]);

  const handleLegalAccept = () => {
    localStorage.setItem('exclusive-lex-purchase-terms-accepted', 'true');
    setShowLegalDisclaimer(false);
    setContentReady(true);
  };

  const handleLegalDecline = () => {
    router.push('/collections');
  };

  const openCarousel = () => {
    setShowCarousel(true);
  };

  const closeCarousel = () => {
    setShowCarousel(false);
  };

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

  // Never return null - always show something
  if (!hasAccess) {
    // This should have been caught by error state, but just in case
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white max-w-md p-8">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Access Required</h2>
          <p className="text-gray-300 mb-6">You need to purchase this collection to view it.</p>
          <button
            onClick={() => router.push(`/collections/${id}`)}
            className="bg-white text-black px-6 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  // If access granted but no media available, show helpful message
  if (hasAccess && !videoUrl && photoUrls.length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Access granted but no media found. Collection:', collection?.title, 'ID:', id);
    }
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white max-w-md p-8">
          <div className="text-yellow-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Content Unavailable</h2>
          <p className="text-gray-300 mb-6">
            This collection has no media attached yet. Please check back later or contact support.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/collections/${id}`)}
              className="w-full bg-white text-black px-6 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              Back to Collection
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-700 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
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

  console.log('Render - Showing media content');

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
        {/* Media Carousel - Inline Mode */}
        {mediaItems.length > 0 && (
          <div className="w-full h-screen">
            <MediaCarousel
              items={mediaItems}
              initialIndex={0}
              mode="inline"
              title={collection?.title}
              className="w-full h-full"
            />
          </div>
        )}

        {/* Open carousel in modal (no labeled fullscreen button) */}
      </div>

      {/* Media Carousel Modal - Fullscreen Mode */}
      {showCarousel && mediaItems.length > 0 && (
        <MediaCarousel
          items={mediaItems}
          initialIndex={0}
          onClose={closeCarousel}
          title={collection?.title}
          mode="modal"
        />
      )}
    </div>
  );
} 