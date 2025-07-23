"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, AlertCircle, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { getSignedUrl } from '@/lib/supabase';
import MediaCarousel from '@/components/MediaCarousel';

interface Purchase {
  id: string;
  user_id: string;
  collection_id: string;
  created_at: string;
  expires_at: string;
  collection: {
    id: string;
    title: string;
    description: string;
    video_path: string;
    thumbnail_path: string;
    duration: number;
    photo_paths: string[];
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
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

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

    // Enhanced screenshot detection
    const detectScreenshotAttempts = () => {
      let screenshotAttempts = 0;
      let lastAttemptTime = 0;
      
      // Monitor for screenshot-related activities
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

      // Listen for various screenshot triggers
      document.addEventListener('keydown', (e) => {
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
      });

      // Monitor window focus/blur (indicates screenshot tools)
      let focusTimeout: NodeJS.Timeout;
      window.addEventListener('blur', () => {
        focusTimeout = setTimeout(() => {
          handleScreenshotAttempt();
        }, 100);
      });

      window.addEventListener('focus', () => {
        if (focusTimeout) {
          clearTimeout(focusTimeout);
        }
      });

      // Monitor for clipboard operations
      document.addEventListener('copy', (e) => {
        e.preventDefault();
        handleScreenshotAttempt();
      });

      document.addEventListener('cut', (e) => {
        e.preventDefault();
        handleScreenshotAttempt();
      });

      // Monitor for right-click context menu
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        handleScreenshotAttempt();
      });

      // Monitor for selection (screenshot tools often select areas)
      document.addEventListener('selectstart', (e) => {
        e.preventDefault();
        handleScreenshotAttempt();
      });

      // Monitor for drag operations
      document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        handleScreenshotAttempt();
      });

      // Monitor for mouse events that might indicate screenshot tools
      let mouseDownTime = 0;
      document.addEventListener('mousedown', () => {
        mouseDownTime = Date.now();
      });

      document.addEventListener('mouseup', () => {
        const duration = Date.now() - mouseDownTime;
        if (duration > 2000) { // Long press might indicate screenshot tool
          handleScreenshotAttempt();
        }
      });

      // Monitor for touch events on mobile
      let touchStartTime = 0;
      document.addEventListener('touchstart', () => {
        touchStartTime = Date.now();
      });

      document.addEventListener('touchend', () => {
        const duration = Date.now() - touchStartTime;
        if (duration > 2000) { // Long touch might indicate screenshot
          handleScreenshotAttempt();
        }
      });
    };

    // Initialize screenshot detection
    detectScreenshotAttempts();

    // Create dynamic watermark (less visible but still present)
    const createWatermark = () => {
      const watermark = document.createElement('div');
      watermark.className = 'watermark-overlay';
      watermark.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    color: rgba(255,0,0,0.3); font-size: 16px; font-weight: bold; 
                    text-align: center; pointer-events: none; z-index: 10002;">
          PRIVATE CONTENT<br>
          ${new Date().toLocaleString()}
        </div>
      `;
      document.body.appendChild(watermark);
    };

    // Add event listeners
    document.addEventListener('contextmenu', preventRightClick);
    document.addEventListener('keydown', preventKeyboardShortcuts);
    document.addEventListener('selectstart', preventDownload);
    document.addEventListener('dragstart', preventDownload);
    
    // Initialize watermark
    createWatermark();
    
    // Update watermark every second
    const watermarkInterval = setInterval(() => {
      const watermark = document.querySelector('.watermark-overlay');
      if (watermark) {
        watermark.innerHTML = `
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                      color: rgba(255,0,0,0.3); font-size: 16px; font-weight: bold; 
                      text-align: center; pointer-events: none; z-index: 10002;">
            PRIVATE CONTENT<br>
            ${new Date().toLocaleString()}
          </div>
        `;
      }
    }, 1000);

    loadPurchase();

    return () => {
      document.removeEventListener('contextmenu', preventRightClick);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
      document.removeEventListener('selectstart', preventDownload);
      document.removeEventListener('dragstart', preventDownload);
      clearInterval(watermarkInterval);
    };
  }, [sessionId]);

  useEffect(() => {
    if (timeRemaining <= 0 && purchase) {
      setError('Access has expired');
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          setError('Access has expired');
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, purchase]);

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

      // Calculate time remaining
      const expiresAt = new Date(purchase.expires_at);
      const now = new Date();
      const remaining = expiresAt.getTime() - now.getTime();
      setTimeRemaining(Math.max(0, remaining));

      // Get signed URL for video
      if (purchase.collection?.video_path) {
        const { data: signedUrl } = await getSignedUrl('media', purchase.collection.video_path);
        if (signedUrl) {
          setVideoUrl(signedUrl.signedUrl);
        }
      }

      // Get signed URLs for photos if they exist
      if (purchase.collection?.photo_paths && purchase.collection.photo_paths.length > 0) {
        console.log('Loading photos from paths:', purchase.collection.photo_paths);
        
        const photoPromises = purchase.collection.photo_paths.map(async (path: string, index: number) => {
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
      } else {
        console.log('No photo paths found in collection data');
      }

    } catch (err: any) {
      console.error('Error loading purchase:', err);
      setError(err.message || 'Failed to load purchase');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
    <div className="min-h-screen bg-stone-900">
      {/* Header */}
      <div className="bg-stone-800 border-b border-stone-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-semibold text-stone-100">Exclusive Content</h1>
            <p className="text-stone-300 text-sm">Limited time access</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-stone-300">
              <Clock className="w-4 h-4 mr-2" />
              <span className="text-sm">{formatTime(timeRemaining)}</span>
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

      {/* Media Carousel */}
      <div className="max-w-7xl mx-auto p-4">
        <MediaCarousel
          videoPath={purchase.collection.video_path}
          photoPaths={purchase.collection.photo_paths || []}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
        />
      </div>

      {/* Video Info */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="mt-6 bg-white rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-stone-800 mb-2">
            Collection Video
          </h2>
          <p className="text-stone-600 mb-4">Your exclusive content is now playing.</p>
          
          <div className="flex items-center justify-between text-sm text-stone-500">
            <span>Purchased: {new Date(purchase.created_at).toLocaleDateString()}</span>
            <span>Time remaining: {formatTime(timeRemaining)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 