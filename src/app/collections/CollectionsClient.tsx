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

  return (
    <main className="w-full min-h-screen px-4 py-8 pt-28" style={{ background: '#D4C7B4' }}>
      <h1 className="text-3xl font-bold text-[#F2E0CF] mb-8 text-reveal">Collections</h1>
      {loading && (
        <div className="flex flex-wrap gap-8 justify-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-6 flex flex-col bg-[#654C37] shadow-lg animate-pulse w-[320px] h-[500px]"></div>
          ))}
        </div>
      )}
      {error && <div className="text-center text-red-600 mb-4">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {videos.slice(0, 8).map((video, index) => (
          <div
            key={video.id}
            className="bg-[#654C37] rounded-2xl shadow-lg flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl text-reveal scale-90"
            style={{ animationDelay: `${index * 0.1}s`, maxWidth: '220px', margin: '0 auto' }}
          >
            <div className="w-full aspect-[9/16] bg-[#C9BBA8] overflow-hidden">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col p-4 flex-1">
              <h2 className="text-xl font-bold text-[#F2E0CF] mb-2 text-left break-words">{video.title}</h2>
              {video.pricing && video.pricing[0]?.price !== undefined && (
                <p className="text-[#C9BBA8] font-bold mb-2 text-lg">${video.pricing[0].price.toFixed(2)}</p>
              )}
              {video.duration !== undefined && (
                <p className="text-[#F2E0CF]/60 text-xs mb-2">Duration: {video.duration} min</p>
              )}
              <p className="text-[#F2E0CF]/80 text-base mb-4 text-left whitespace-pre-line" style={{ minHeight: '60px' }}>{video.description}</p>
              <button
                className="bg-[#D4C7B4] text-[#654C37] px-4 py-2 rounded-xl font-semibold shadow-lg hover:bg-[#C9BBA8] transition-all duration-300 mt-auto w-full button-animate"
                onClick={() => handlePurchase(video)}
                disabled={!video}
              >
                {video ? 'Purchase to Unlock' : 'Unavailable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
} 