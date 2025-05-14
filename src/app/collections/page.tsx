"use client";
import { Metadata } from 'next';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export const metadata: Metadata = {
  title: 'Collections - Exclusive Lex',
  description: 'Browse our exclusive video collections',
};

const mockVideos = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  title: `Video ${i + 1}`,
  description: 'Premium digital product',
  thumbnail: '/placeholder.jpg',
  purchased: false,
}));

export default function CollectionsPage() {
  const router = useRouter();

  const handlePurchase = useCallback((video: typeof mockVideos[0]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify([video]));
      router.push('/cart');
    }
  }, [router]);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-900 mb-8">Collections</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {mockVideos.map((video) => (
          <div key={video.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col">
            <div className="aspect-video bg-gray-200 rounded mb-4 flex items-center justify-center">
              <img src={video.thumbnail} alt={video.title} className="object-cover w-full h-full rounded" />
            </div>
            <h2 className="text-lg font-semibold text-green-900 mb-2">{video.title}</h2>
            <p className="text-gray-600 mb-4">{video.description}</p>
            <button
              className="bg-green-900 text-white px-4 py-2 rounded hover:bg-green-800 mt-auto"
              onClick={() => handlePurchase(video)}
            >
              {video.purchased ? 'View' : 'Purchase to Unlock'}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
} 