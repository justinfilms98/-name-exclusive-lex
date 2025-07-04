"use client";
import { prisma } from '@/lib/prisma';
import { notFound, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import type { CollectionVideo } from '@prisma/client';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const collectionVideoId = searchParams?.get('collectionVideoId');
  const [mediaItem, setMediaItem] = useState<CollectionVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collectionVideoId) {
      setError("No media item selected.");
      setLoading(false);
      return;
    }

    async function fetchMedia() {
      try {
        // This is a client component, so we need an API route to fetch data
        const response = await fetch(`/api/media/${collectionVideoId}`);
        if (!response.ok) {
          throw new Error('Media not found');
        }
        const data = await response.json();
        setMediaItem(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMedia();
  }, [collectionVideoId]);

  const handleCheckout = async () => {
    if (!collectionVideoId) return;
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionVideoId }),
      });
      const { url, error } = await res.json();
      if (error) {
        throw new Error(error);
      }
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center">Loading item...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>
  if (!mediaItem) return notFound();

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-lg mx-auto">
      <div className="p-8">
        <h2 className="text-2xl font-serif text-stone-800 mb-4">Complete Your Purchase</h2>
        <div className="flex items-center space-x-4 border-t border-b py-4 my-4">
          <img
            src={mediaItem.thumbnail || '/placeholder-thumbnail.jpg'}
            alt={mediaItem.title}
            className="w-24 h-24 object-cover rounded-md"
          />
          <div>
            <h3 className="text-lg font-semibold text-stone-700">{mediaItem.title}</h3>
            <p className="text-stone-500 text-sm">{mediaItem.description}</p>
          </div>
          <p className="text-xl font-semibold text-stone-800 ml-auto">
            ${mediaItem.price?.toString()}
          </p>
        </div>
        <p className="text-sm text-stone-600 mb-6">
          You are about to purchase permanent access to this content.
          After payment, you will be redirected to a page where you can view your content.
        </p>
        <button 
          onClick={handleCheckout}
          className="w-full bg-emerald-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-emerald-700 transition-colors"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}


export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-stone-50 py-20">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
} 