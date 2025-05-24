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
      <h1 className="text-3xl font-bold text-green-900 mb-8">Collections</h1>
      {loading && <div className="text-center text-lg">Loading...</div>}
      {error && <div className="text-center text-red-600 mb-4">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {slots.map((slot) => {
          const video = videos.find(v => v.order === slot) || videos[slot - 1];
          return (
            <div key={slot} className="bg-brand-almond rounded-lg shadow p-4 flex flex-col items-center min-h-[340px] transition-transform hover:scale-105 hover:shadow-xl">
              <div className="aspect-[9/16] w-full bg-brand-mist rounded mb-4 flex items-center justify-center overflow-hidden">
                {video ? (
                  <img src={video.thumbnail} alt={video.title} className="object-cover w-full h-full rounded" />
                ) : (
                  <span className="text-brand-sage">No Video</span>
                )}
              </div>
              <h2 className="text-lg font-serif text-brand-pine mb-1 text-center truncate w-full">{video ? video.title : `Video ${slot}`}</h2>
              <p className="text-brand-earth text-sm mb-2 text-center line-clamp-2">{video ? video.description : 'No description'}</p>
              {video && video.pricing && video.pricing[0]?.price !== undefined && (
                <p className="text-brand-tan font-bold mb-2">${video.pricing[0].price.toFixed(2)}</p>
              )}
              {video && video.duration !== undefined && (
                <p className="text-brand-sage text-xs mb-2">Duration: {video.duration} min</p>
              )}
              <button
                className="bg-brand-pine text-white px-4 py-2 rounded shadow hover:bg-brand-earth focus:outline-none focus:ring-2 focus:ring-brand-tan transition mt-auto w-full"
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