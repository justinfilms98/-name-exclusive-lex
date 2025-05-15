"use client";
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

const mockVideos = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  title: `Video ${i + 1}`,
  description: 'Premium digital product',
  thumbnail: '/placeholder.jpg',
  purchased: false,
  price: 9.99 + i, // Example price for each video
}));

export default function CollectionsClient() {
  const router = useRouter();

  const handlePurchase = useCallback((video: typeof mockVideos[0]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify([video]));
      router.push('/cart');
    }
  }, [router]);

  // Simulate up to 8 slots
  const slots = Array.from({ length: 8 }, (_, i) => i + 1);
  // Replace mockVideos with only up to 8 videos
  const videos = mockVideos.slice(0, 8);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-900 mb-8">Collections</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {slots.map((slot) => {
          const video = videos.find(v => v.id === slot);
          return (
            <div key={slot} className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
              <div className="aspect-video w-full bg-gray-200 rounded mb-4 flex items-center justify-center">
                {video ? (
                  <img src={video.thumbnail} alt={video.title} className="object-cover w-full h-full rounded" />
                ) : (
                  <span className="text-gray-400">No Video</span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-green-900 mb-2">{video ? video.title : `Video ${slot}`}</h2>
              <p className="text-gray-600 mb-4">{video ? video.description : 'No description'}</p>
              {video && video.price !== undefined && (
                <div className="mb-2 text-green-800 font-bold">${video.price.toFixed(2)}</div>
              )}
              <button
                className="bg-green-900 text-white px-4 py-2 rounded hover:bg-green-800 mt-auto w-full"
                onClick={() => video && handlePurchase(video)}
              >
                Purchase to Unlock
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
} 