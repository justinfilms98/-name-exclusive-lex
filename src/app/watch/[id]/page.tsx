"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import MediaCarousel from '@/components/MediaCarousel';
import PurchaseDisclaimer from '@/components/PurchaseDisclaimer';
import ClientGuards from '@/components/security/ClientGuards';

interface MediaItem {
  id: string;
  type: 'video' | 'photo';
  path?: string | null;
  collectionId: string;
  title?: string;
  description?: string;
}

interface Purchase {
  id: string;
  user_id: string;
  collection_id: string;
  created_at: string;
  is_active: boolean;
  deactivated_at: string | null;
  collection: {
    id: string;
    title: string;
    description: string;
    video_path: string;
    thumbnail_path: string;
    photo_paths: string[];
    media_filename?: string; // Added for video_path fallback
  };
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const collectionId = resolvedParams.id;
  
  return <WatchPageClient collectionId={collectionId} />;
}

function WatchPageClient({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      return;
    }

    // Add security features (prevent download, right-click, keyboard shortcuts)
    const preventDownload = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const preventRightClick = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Prevent common screenshot shortcuts
      if (
        (e.ctrlKey && e.key === 's') || // Ctrl+S
        (e.ctrlKey && e.key === 'p') || // Ctrl+P
        (e.key === 'F12') || // F12
        (e.key === 'PrintScreen') || // Print Screen
        (e.key === 'F11') || // F11
        (e.metaKey && e.key === 's') || // Cmd+S (Mac)
        (e.metaKey && e.key === 'p') || // Cmd+P (Mac)
        (e.altKey && e.key === 'PrintScreen') // Alt+PrintScreen
      ) {
        e.preventDefault();
        blurMedia();
        return false;
      }
    };

    // Aggressive screenshot detection and prevention
    const blurMedia = () => {
      const mediaContainer = document.querySelector('.video-container') as HTMLElement;
      if (mediaContainer) {
        mediaContainer.style.filter = 'blur(20px)';
        mediaContainer.style.transition = 'filter 0.3s ease';
        
        // Show warning
        const warning = document.createElement('div');
        warning.className = 'fixed inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-50';
        warning.innerHTML = `
          <div class="text-center text-white p-8">
            <h2 class="text-2xl font-bold mb-4">⚠️ SCREENSHOT DETECTED</h2>
            <p class="text-lg">Screenshot attempts are not allowed for this private content.</p>
            <p class="text-sm mt-2">Content has been blurred for security.</p>
          </div>
        `;
        document.body.appendChild(warning);
        
        // Remove warning after 5 seconds
        setTimeout(() => {
          if (warning.parentNode) {
            warning.parentNode.removeChild(warning);
          }
        }, 5000);
        
        // Unblur after 10 seconds
        setTimeout(() => {
          if (mediaContainer) {
            mediaContainer.style.filter = 'none';
          }
        }, 10000);
      }
    };

    // Screenshot detection
    const detectScreenshotAttempts = () => {
      let screenshotAttempts = 0;
      let lastAttemptTime = 0;
      
      const handleScreenshotAttempt = () => {
        const now = Date.now();
        if (now - lastAttemptTime < 1000) {
          screenshotAttempts++;
        } else {
          screenshotAttempts = 1;
        }
        lastAttemptTime = now;
        
        if (screenshotAttempts >= 2) {
          blurMedia();
          screenshotAttempts = 0;
        }
      };

      // Monitor for screenshot triggers
      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.key === 'PrintScreen' ||
          (e.ctrlKey && e.key === 's') ||
          (e.ctrlKey && e.key === 'p') ||
          (e.metaKey && e.key === 's') ||
          (e.metaKey && e.key === 'p') ||
          e.key === 'F12' ||
          e.key === 'F11'
        ) {
          e.preventDefault();
          handleScreenshotAttempt();
        }
      };

      // Monitor window focus/blur
      let focusTimeout: NodeJS.Timeout;
      const handleBlur = () => {
        focusTimeout = setTimeout(() => {
          handleScreenshotAttempt();
        }, 100);
      };

      const handleFocus = () => {
        if (focusTimeout) {
          clearTimeout(focusTimeout);
        }
      };

      // Monitor for clipboard operations
      const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault();
        handleScreenshotAttempt();
      };

      const handleCut = (e: ClipboardEvent) => {
        e.preventDefault();
        handleScreenshotAttempt();
      };

      // Monitor for context menu
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        handleScreenshotAttempt();
      };

      // Monitor for selection
      const handleSelectStart = (e: Event) => {
        e.preventDefault();
        handleScreenshotAttempt();
      };

      // Monitor for drag operations
      const handleDragStart = (e: DragEvent) => {
        e.preventDefault();
        handleScreenshotAttempt();
      };

      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
      document.addEventListener('copy', handleCopy);
      document.addEventListener('cut', handleCut);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('selectstart', handleSelectStart);
      document.addEventListener('dragstart', handleDragStart);

      // Cleanup function
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('cut', handleCut);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('selectstart', handleSelectStart);
        document.removeEventListener('dragstart', handleDragStart);
      };
    };

    const cleanup = detectScreenshotAttempts();
    return cleanup;
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadPurchase();
    }
  }, [sessionId]);

  // Prepare media items for carousel
  useEffect(() => {
    if (videoPath || photoPaths.length > 0) {
      const items: MediaItem[] = [];
      
      // Add video as first item if available
      if (videoPath) {
        items.push({
          id: 'video',
          type: 'video',
          path: videoPath,
          collectionId,
          title: purchase?.collection?.title || 'Video',
          description: purchase?.collection?.description
        });
      }
      
      // Add photos
      photoPaths.forEach((path, index) => {
        items.push({
          id: `photo-${index}`,
          type: 'photo',
          path,
          collectionId,
          title: `${purchase?.collection?.title || 'Photo'} ${index + 1}`,
          description: purchase?.collection?.description
        });
      });
      
      setMediaItems(items);
    }
  }, [videoPath, photoPaths, purchase, collectionId]);

  const loadPurchase = async () => {
    try {
      const res = await fetch(`/api/get-purchase?session_id=${sessionId}`);
      const { purchase, error } = await res.json();
      
      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      // Verify the purchase is for the correct collection
      if (purchase.collection_id !== collectionId) {
        setError('Purchase does not match this collection');
        setLoading(false);
        return;
      }

      setPurchase(purchase);

      if (purchase.collection?.video_path || purchase.collection?.media_filename) {
        const resolvedVideoPath =
          purchase.collection.media_filename || purchase.collection.video_path;
        setVideoPath(resolvedVideoPath || null);
      }

      if (purchase.collection?.photo_paths && purchase.collection.photo_paths.length > 0) {
        setPhotoPaths(purchase.collection.photo_paths);
      } else {
        setPhotoPaths([]);
      }

    } catch (err: any) {
      console.error('Error loading purchase:', err);
      setError(err.message || 'Failed to load purchase');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-stone-300 text-lg">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-100 mb-2">Access Denied</h1>
          <p className="text-stone-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/collections')}
            className="inline-flex items-center px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-semibold text-stone-100 mb-2">Purchase Not Found</h1>
          <p className="text-stone-300 mb-6">You need to purchase this collection to watch it.</p>
          <button
            onClick={() => router.push('/collections')}
            className="inline-flex items-center px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
          >
            Browse Collections
          </button>
        </div>
      </div>
    );
  }

  console.log('Watch page - purchase.collection:', purchase.collection);
  console.log('Watch page - photo_paths:', purchase.collection.photo_paths);

  return (
    <ClientGuards>
    <div className="min-h-screen bg-stone-900">
      {/* Header */}
      <div className="bg-stone-800 border-b border-stone-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-semibold text-stone-100">Exclusive Content</h1>
            <p className="text-stone-300 text-sm">Permanent access</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-stone-300">
              <span className="text-sm">Permanent Access</span>
            </div>
            
            <button
              onClick={() => router.push('/collections')}
              className="text-stone-300 hover:text-white transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer Banner */}
      {showDisclaimer && (
        <div className="bg-stone-800 border-b border-stone-700">
          <div className="max-w-7xl mx-auto p-4">
            <PurchaseDisclaimer variant="watch" />
            <button
              onClick={() => setShowDisclaimer(false)}
              className="mt-2 text-stone-400 hover:text-stone-300 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Media Carousel */}
      {mediaItems.length > 0 && (
        <div className="max-w-7xl mx-auto p-4">
          <MediaCarousel
            items={mediaItems}
            initialIndex={0}
            title={purchase.collection.title}
          />
        </div>
      )}

      {/* Video Info */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="mt-6 bg-white rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-stone-800 mb-2">
            Collection Video
          </h2>
          <p className="text-stone-600 mb-4">Your exclusive content is now playing.</p>
          
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>Purchased: {new Date(purchase.created_at).toLocaleDateString()}</span>
            <span>Permanent Access</span>
          </div>
        </div>
      </div>
    </div>
    </ClientGuards>
  );
} 