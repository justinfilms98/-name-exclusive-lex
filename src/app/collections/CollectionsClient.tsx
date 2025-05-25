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
      const cartItem = {
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        price,
      };
      localStorage.setItem('cart', JSON.stringify([cartItem]));
      push('/cart');
    }
  }, [push]);

  // Simulate up to 8 slots for layout
  const slots = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <main className="container mx-auto px-4 py-8 pt-28">
      <h1 className="text-3xl font-bold text-[#F2E0CF] mb-8 text-reveal">Collections</h1>
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="premium-card h-[340px] rounded-lg p-4">
              <div className="skeleton aspect-[9/16] w-full rounded mb-4"></div>
              <div className="skeleton h-6 w-3/4 mx-auto mb-2"></div>
              <div className="skeleton h-4 w-full mb-2"></div>
              <div className="skeleton h-4 w-1/2 mx-auto"></div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-center text-red-600 mb-4">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {slots.slice(0, 8).map((slot, index) => {
          const video = videos.find(v => v.order === slot) || videos[slot - 1];
          return (
            <div 
              key={slot} 
              className="premium-card rounded-lg p-4 flex flex-col items-center h-[420px] text-reveal"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="aspect-[9/16] w-full rounded mb-4 flex items-center justify-center overflow-hidden group relative">
                {video ? (
                  <>
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="object-cover w-full h-full rounded transition-transform duration-500 group-hover:scale-110" 
                    />
                    {video.category === 'premium' && (
                      <div className="premium-badge">Premium</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </>
                ) : (
                  <span className="text-[#F2E0CF]">No Video</span>
                )}
              </div>
              <h2 className="text-lg font-serif text-[#F2E0CF] mb-1 text-center truncate w-full">{video ? video.title : `Video ${slot}`}</h2>
              <p className="text-[#F2E0CF]/80 text-sm mb-2 text-center line-clamp-2">{video ? video.description : 'No description'}</p>
              {video && video.pricing && video.pricing[0]?.price !== undefined && (
                <p className="text-[#C9BBA8] font-bold mb-2">${video.pricing[0].price.toFixed(2)}</p>
              )}
              {video && video.duration !== undefined && (
                <p className="text-[#F2E0CF]/60 text-xs mb-2">Duration: {video.duration} min</p>
              )}
              <button
                className="bg-[#654C37] text-[#F2E0CF] px-4 py-2 rounded shadow-lg hover:bg-[#654C37]/90 transition-all duration-300 hover-lift focus-ring border border-[#C9BBA8]/20 mt-auto w-full"
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