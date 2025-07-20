"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase, getSignedUrl } from '@/lib/supabase';
import { ArrowLeft, Clock, Image as ImageIcon, Shield, Download, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

interface Collection {
  id: string;
  title: string;
  description: string;
  video_path: string;
  photo_paths: string[];
  duration: number;
}

interface Purchase {
  expires_at: string;
  created_at: string;
}

interface WatchPageClientProps {
  collection: Collection;
  purchase: Purchase;
  user: any;
}

export default function WatchPageClient({ collection, purchase, user }: WatchPageClientProps) {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [currentMedia, setCurrentMedia] = useState<'video' | 'photos'>('video');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadMediaUrls();
    logWatchActivity();
    
    // Set up expiration timer
    const expiresAt = new Date(purchase.expires_at);
    const updateTimer = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft(0);
        // Redirect to collections when expired
        setTimeout(() => {
          window.location.href = '/collections';
        }, 5000);
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [purchase.expires_at]);

  // Refresh signed URLs every 45 seconds (before 60s expiration)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (currentMedia === 'video' && videoUrl) {
        loadVideoUrl();
      }
    }, 45000);

    return () => clearInterval(refreshInterval);
  }, [currentMedia, videoUrl]);

  const loadMediaUrls = async () => {
    try {
      await Promise.all([
        loadVideoUrl(),
        loadPhotoUrls()
      ]);
    } catch (error) {
      console.error('Failed to load media URLs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVideoUrl = async () => {
    try {
      const { data, error } = await getSignedUrl('media', collection.video_path, 60); // 60 second expiration
      if (!error && data) {
        setVideoUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Failed to load video URL:', error);
    }
  };

  const loadPhotoUrls = async () => {
    try {
      const urls = await Promise.all(
        collection.photo_paths.map(async (path) => {
          const { data, error } = await getSignedUrl('media', path, 300); // 5 minute expiration for photos
          return !error && data ? data.signedUrl : null;
        })
      );
      setPhotoUrls(urls.filter(url => url !== null) as string[]);
    } catch (error) {
      console.error('Failed to load photo URLs:', error);
    }
  };

  const logWatchActivity = async () => {
    try {
      const userAgent = navigator.userAgent;
      const ipResponse = await fetch('/api/get-ip');
      const ipData = await ipResponse.json();
      
      await supabase
        .from('watch_logs')
        .insert([
          {
            user_id: user.id,
            collection_id: collection.id,
            user_agent: userAgent,
            ip_address: ipData.ip || 'unknown',
          }
        ]);
    } catch (error) {
      console.error('Failed to log watch activity:', error);
    }
  };

  const formatTimeLeft = (seconds: number): string => {
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleVideoLoad = () => {
    // Disable picture-in-picture
    if (videoRef.current) {
      videoRef.current.disablePictureInPicture = true;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-almond pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Loading exclusive content...</p>
        </div>
      </div>
    );
  }

  if (timeLeft === 0) {
    return (
      <div className="min-h-screen bg-almond pt-20 flex items-center justify-center">
        <div className="card-glass max-w-md mx-auto p-8 text-center">
          <Clock className="w-16 h-16 text-sage mx-auto mb-4" />
          <h2 className="heading-2 mb-4">Access Expired</h2>
          <p className="text-sage mb-6">
            Your access to this collection has expired. Purchase again to continue watching.
          </p>
          <Link href="/collections" className="btn-primary">
            Browse Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-almond pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/collections"
            className="flex items-center text-sage hover:text-khaki transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Collections
          </Link>

          {timeLeft && timeLeft > 0 && (
            <div className="flex items-center space-x-2 bg-sage/10 text-sage px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Access expires in: {formatTimeLeft(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Title and Description */}
        <div className="mb-8">
          <h1 className="heading-1 mb-4">{collection.title}</h1>
          <p className="body-large text-sage max-w-3xl">{collection.description}</p>
        </div>

        {/* Media Toggle */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setCurrentMedia('video')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentMedia === 'video' 
                ? 'bg-sage text-blanc' 
                : 'bg-blanket text-earth hover:bg-mushroom'
            }`}
          >
            Video Content
          </button>
          <button
            onClick={() => setCurrentMedia('photos')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentMedia === 'photos' 
                ? 'bg-sage text-blanc' 
                : 'bg-blanket text-earth hover:bg-mushroom'
            }`}
          >
            Photos ({collection.photo_paths.length})
          </button>
        </div>

        {/* Media Content */}
        {currentMedia === 'video' ? (
          <div className="relative mb-8">
            <div className="card-glass rounded-xl overflow-hidden">
              {videoUrl ? (
                <div 
                  className="relative"
                  onContextMenu={handleContextMenu}
                >
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    onContextMenu={handleContextMenu}
                    onLoad={handleVideoLoad}
                    className="w-full h-auto max-h-[70vh] bg-black"
                    style={{ userSelect: 'none' }}
                  >
                    Your browser does not support the video tag.
                  </video>

                  {/* Watermark Overlay */}
                  <div className="watermark">
                    <div className="watermark-text">
                      {user.email}
                    </div>
                    <div 
                      className="watermark-text absolute top-1/4 left-1/4"
                      style={{ transform: 'rotate(-45deg)' }}
                    >
                      Exclusive Lex
                    </div>
                    <div 
                      className="watermark-text absolute bottom-1/4 right-1/4"
                      style={{ transform: 'rotate(45deg)' }}
                    >
                      {user.email}
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="absolute top-4 right-4 bg-black/50 text-blanc px-3 py-1 rounded-lg text-sm flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Protected Content</span>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-mushroom to-blanket flex items-center justify-center">
                  <div className="text-center text-sage">
                    <div className="w-12 h-12 spinner mx-auto mb-4"></div>
                    <p>Loading video...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {photoUrls.map((photoUrl, index) => (
              <div 
                key={index} 
                className="card-glass rounded-xl overflow-hidden hover:shadow-elegant transition-shadow"
                onContextMenu={handleContextMenu}
              >
                <div className="relative aspect-[4/5] bg-gradient-to-br from-mushroom to-blanket">
                  <img
                    src={photoUrl}
                    alt={`${collection.title} - Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    onContextMenu={handleContextMenu}
                    onDragStart={(e) => e.preventDefault()}
                    style={{ userSelect: 'none' }}
                  />

                  {/* Photo Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-blanc/30 text-sm font-medium transform rotate-45">
                      {user.email}
                    </div>
                  </div>

                  {/* Download Prevention Notice */}
                  <div className="absolute top-2 right-2 bg-black/50 text-blanc p-1 rounded">
                    <Download className="w-3 h-3 opacity-50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Security Info */}
        <div className="card bg-khaki/10 border-khaki/30 p-6">
          <h3 className="text-khaki font-serif text-lg mb-3 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Content Protection Notice
          </h3>
          <div className="text-earth text-sm space-y-2">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-khaki rounded-full mr-3 mt-2"></div>
              <span>This content is watermarked with your email for security</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-khaki rounded-full mr-3 mt-2"></div>
              <span>Download and screen recording are disabled</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-khaki rounded-full mr-3 mt-2"></div>
              <span>Access is time-limited and cannot be transferred</span>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-khaki rounded-full mr-3 mt-2"></div>
              <span>All viewing activity is logged for security purposes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 