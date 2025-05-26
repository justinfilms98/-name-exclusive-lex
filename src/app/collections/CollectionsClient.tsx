"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

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
}

type CartItem = {
  id: number;
  title: string;
  thumbnail: string;
  price: number;
};

export default function CollectionsClient() {
  const [videos, setVideos] = useState<CollectionVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { push } = useRouter();

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

  const handlePurchase = useCallback((video: CollectionVideo) => {
    if (typeof window !== 'undefined') {
      const price = video.pricing && video.pricing[0] && typeof video.pricing[0].price === 'number' ? video.pricing[0].price : 0;
      const cartItem: CartItem = {
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        price,
      };
      let cart: CartItem[] = [];
      try {
        cart = JSON.parse(localStorage.getItem('cart') || '[]');
      } catch {}
      // Prevent duplicates
      if (!cart.some((item) => item.id === cartItem.id)) {
        cart.push(cartItem);
        localStorage.setItem('cart', JSON.stringify(cart));
      }
      // Always go to cart after
      push('/cart');
    }
  }, [push]);

  // Simulate up to 8 slots for layout
  const slots = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <main className="container mx-auto px-4 py-8 pt-28" style={{ background: '#D4C7B4', minHeight: '100vh' }}>
      <h1 className="text-3xl font-bold text-[#F2E0CF] mb-8 text-reveal">Collections</h1>
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="premium-card h-[500px] rounded-2xl p-6 flex flex-col"></div>
          ))}
        </div>
      )}
      {error && <div className="text-center text-red-600 mb-4">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {slots.slice(0, 8).map((slot, index) => {
          const video = videos.find(v => v.order === slot) || videos[slot - 1];
          return (
            <div 
              key={slot} 
              className="premium-card rounded-2xl p-6 flex flex-col items-center h-[500px] text-reveal shadow-lg"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-full aspect-[9/16] rounded-xl mb-4 flex items-center justify-center overflow-hidden bg-[#C9BBA8] relative">
                {video ? (
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="object-cover w-full h-full rounded-xl" 
                  />
                ) : (
                  <span className="text-[#F2E0CF]">No Video</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-[#F2E0CF] mb-2 text-center truncate w-full">{video ? video.title : `Video ${slot}`}</h2>
              <p className="text-[#F2E0CF]/80 text-base mb-2 text-center line-clamp-2">{video ? video.description : 'No description'}</p>
              {video && video.pricing && video.pricing[0]?.price !== undefined && (
                <p className="text-[#C9BBA8] font-bold mb-2 text-lg">${video.pricing[0].price.toFixed(2)}</p>
              )}
              {video && video.duration !== undefined && (
                <p className="text-[#F2E0CF]/60 text-xs mb-2">Duration: {video.duration} min</p>
              )}
              <button
                className="bg-[#654C37] text-[#F2E0CF] px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-[#654C37]/90 transition-all duration-300 mt-auto w-full"
                onClick={() => video && handlePurchase(video)}
                disabled={!video}
              >
                {video ? 'Purchase to Unlock' : 'Unavailable'}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
} 