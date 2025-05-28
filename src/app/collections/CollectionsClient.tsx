"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface CollectionVideo {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  price?: number;
  order: number;
  category?: string;
  ageRating?: string;
  tags?: string[];
  pricing?: any[];
  duration?: number;
  thumbnailPath?: string;
}

export default function CollectionsClient() {
  const [videos, setVideos] = useState<CollectionVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<CollectionVideo | null>(null);
  const { push } = useRouter();
  const { addItem, isInCart } = useCart();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const videoRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/collection-videos');
        if (!res.ok) throw new Error('Failed to fetch collection videos');
        const data = await res.json();
        setVideos(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load collections');
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  useEffect(() => {
    // Handle anchor links from cart page
    const hash = window.location.hash;
    if (hash) {
      const videoId = parseInt(hash.replace('#', ''));
      if (!isNaN(videoId)) {
        // Wait for videos to load
        setTimeout(() => {
          const element = videoRefs.current[videoId];
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the video briefly
            element.classList.add('ring-4', 'ring-[#654C37]', 'ring-opacity-50');
            setTimeout(() => {
              element.classList.remove('ring-4', 'ring-[#654C37]', 'ring-opacity-50');
            }, 2000);
          }
        }, 500);
      }
    }
  }, [videos]);

  const handlePurchase = useCallback(async (video: CollectionVideo) => {
    if (!session) {
      // Redirect to sign in if not authenticated
      push('/api/auth/signin');
      return;
    }

    const price = video.pricing?.[0]?.price ?? 0;
    const cartItem = {
      id: video.id,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      price,
      videoUrl: video.videoUrl
    };

    try {
      addItem(cartItem);
      // Show success message or animation
      setSelectedVideo(video);
      setTimeout(() => {
        push('/cart');
      }, 1000);
    } catch (err) {
      setError('Failed to add item to cart');
    }
  }, [addItem, push, session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#654C37]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl mb-2">Error loading collections</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="min-h-screen bg-[#D4C7B4] pt-28 pb-12">
        <div className="container mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl font-serif text-[#654C37] mb-8 text-center"
          >
            Exclusive Collection
          </motion.h1>
          {/* Enhanced Pinterest-style Masonry Grid */}
          <div
            className="columns-1 sm:columns-2 lg:columns-4 gap-8 [column-fill:_balance] [&>div]:mb-8"
          >
            <AnimatePresence mode="popLayout">
              {videos.slice(0, 8).map((video, index) => {
                // Staggered min-height for card content
                const minHeights = ["min-h-[120px]", "min-h-[160px]", "min-h-[200px]", "min-h-[180px]"];
                const minHeightClass = minHeights[index % minHeights.length];
                return (
                  <motion.div
                    key={video.id}
                    ref={(el: HTMLDivElement | null) => {
                      videoRefs.current[video.id] = el;
                    }}
                    layout
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.4,
                      delay: index * 0.1,
                      layout: { duration: 0.3 },
                      ease: "easeOut"
                    }}
                    whileHover={{ scale: 1.04, boxShadow: "0 8px 32px 0 rgba(101,76,55,0.18)" }}
                    className="break-inside-avoid bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl relative group"
                  >
                    {/* 9:16 Aspect Ratio Thumbnail with Overlay */}
                    <motion.div 
                      className="relative w-full aspect-[9/16] bg-[#E9E4DF] overflow-hidden"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image
                        src={video.thumbnailPath || video.thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover rounded-t-xl transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Overlay on hover */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end opacity-0 group-hover:opacity-100 p-4 transition-opacity"
                      >
                        <div>
                          <h2 className="text-lg font-bold text-white mb-1 drop-shadow-lg">{video.title}</h2>
                          {video.pricing && video.pricing[0]?.price !== undefined && (
                            <p className="text-[#C9BBA8] font-bold text-base drop-shadow-lg">
                              ${video.pricing[0].price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </motion.div>
                      {video.duration && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + index * 0.1 }}
                          className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-xs"
                        >
                          {video.duration} min
                        </motion.div>
                      )}
                    </motion.div>
                    {/* Card Content with Staggered Height */}
                    <motion.div 
                      className={`flex flex-col p-4 flex-1 ${minHeightClass}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <motion.h2 
                        className="text-lg font-bold text-[#654C37] mb-2 text-left break-words"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {video.title}
                      </motion.h2>
                      {video.pricing && video.pricing[0]?.price !== undefined && (
                        <motion.p 
                          className="text-[#C9BBA8] font-bold mb-2 text-base"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                        >
                          ${video.pricing[0].price.toFixed(2)}
                        </motion.p>
                      )}
                      <motion.p 
                        className="text-[#654C37]/80 text-sm mb-4 text-left whitespace-pre-line"
                        style={{ minHeight: '40px' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        {video.description}
                      </motion.p>
                      <motion.button
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePurchase(video)}
                        disabled={isInCart(video.id)}
                        className={`w-full py-2 px-4 rounded-xl font-semibold shadow-lg transition-all duration-300 mt-auto ${
                          isInCart(video.id)
                            ? 'bg-green-600 text-white cursor-not-allowed'
                            : 'bg-[#D4C7B4] text-[#654C37] hover:bg-[#C9BBA8] hover:shadow-xl'
                        }`}
                      >
                        {isInCart(video.id) ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                            In Cart
                          </motion.div>
                        ) : 'Purchase to Unlock'}
                      </motion.button>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Success Animation */}
          <AnimatePresence>
            {selectedVideo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 50, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.8, y: 50, opacity: 0 }}
                  transition={{ 
                    duration: 0.4,
                    ease: "backOut"
                  }}
                  className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm w-full mx-4"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 0.6,
                      ease: "backOut",
                      delay: 0.1
                    }}
                    className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <motion.svg
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="w-10 h-10 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-bold text-[#654C37] mb-3"
                  >
                    Added to Cart!
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-[#654C37]/80"
                  >
                    {selectedVideo.title}
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="w-8 h-8 mx-auto mb-4"
                    >
                      <svg className="w-full h-full text-[#654C37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </motion.div>
                    <p className="text-[#654C37]/60 text-sm">Redirecting to cart...</p>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </Suspense>
  );
} 