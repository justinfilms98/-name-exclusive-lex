"use client";

import React, { useEffect, useState } from 'react';
import CollectionVideoModal from './CollectionVideoModal';
import { useSession, signIn } from 'next-auth/react';

interface CollectionVideo {
  id: number;
  collection: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  order: number;
  category: string;
  ageRating: 'G' | 'PG' | 'PG-13' | 'R';
  tags: string[];
  pricing: any[];
}

export default function CollectionVideosPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  const [videos, setVideos] = useState<CollectionVideo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [editData, setEditData] = useState<CollectionVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function fetchVideos() {
    setLoading(true);
    fetch('/api/collection-videos')
      .then(res => res.json())
      .then(data => setVideos(
        data.map((v: any) => ({
          ...v,
          category: v.category || '',
          ageRating: v.ageRating || 'PG',
          tags: v.tags || [],
          pricing: v.pricing || [{ type: 'one_time', price: 0, currency: 'USD', isActive: true }],
        }))
      ))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isLoggedIn) fetchVideos();
  }, [isLoggedIn]);

  function handleOpen(slot: number, video?: Partial<CollectionVideo>) {
    setSelectedSlot(slot);
    if (video) {
      setEditData({
        id: video.id ?? 0,
        collection: video.collection ?? '',
        title: video.title ?? '',
        description: video.description ?? '',
        thumbnail: video.thumbnail ?? '',
        videoUrl: video.videoUrl ?? '',
        order: video.order ?? slot,
        category: (video as any).category ?? '',
        ageRating: (video as any).ageRating ?? 'PG',
        tags: (video as any).tags ?? [],
        pricing: (video as any).pricing ?? [{ type: 'one_time', price: 0, currency: 'USD', isActive: true }],
      });
    } else {
      setEditData(null);
    }
    setModalOpen(true);
  }

  async function handleSave(data: any) {
    setLoading(true);
    setModalOpen(false);
    try {
      if (editData) {
        // Update existing
        const res = await fetch('/api/collection-videos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editData, ...data, id: editData.id }),
        });
        if (!res.ok) throw new Error('Failed to update video');
      } else {
        // Create new
        const res = await fetch('/api/collection-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to add video');
      }
      setNotification({ type: 'success', message: 'Video saved successfully!' });
      fetchVideos();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(video: CollectionVideo) {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/collection-videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: video.id }),
      });
      if (!res.ok) throw new Error('Failed to delete video');
      setNotification({ type: 'success', message: 'Video deleted successfully!' });
      fetchVideos();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  // Only show 8 slots for now, but leave room for more later
  const slots = Array.from({ length: 8 }, (_, i) => i + 1);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-6">Manage Collection Videos</h2>
        <button
          className="bg-green-900 text-white px-6 py-2 rounded hover:bg-green-800 transition"
          onClick={() => signIn()}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Manage Collection Videos</h2>
      {notification && (
        <div className={`mb-4 p-3 rounded text-center ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{notification.message}</div>
      )}
      {loading && <div className="mb-4 text-center">Loading...</div>}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
        {slots.map((slot) => {
          const video = videos.find(v => v.order === slot);
          return (
            <div
              key={slot}
              className="inline-block w-full mb-6 rounded-[2rem] bg-white shadow-lg overflow-hidden transition-transform hover:scale-105 hover:shadow-2xl group relative"
              style={{ breakInside: 'avoid' }}
            >
              {video ? (
                <>
                  <img src={video.thumbnail} alt={video.title} className="w-full h-48 object-cover rounded-t-[2rem]" />
                  <div className="p-4 flex flex-col gap-2">
                    <div className="text-lg font-bold truncate">{video.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-2">{video.description}</div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-full transition-all duration-200 shadow hover:bg-blue-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        onClick={() => handleOpen(slot, video)}
                      >
                        Edit / Upload
                      </button>
                      <button
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-full transition-all duration-200 shadow hover:bg-red-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400"
                        onClick={() => handleDelete(video)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-[2rem] text-gray-400 text-2xl">No Video</div>
                  <div className="p-4 flex flex-col gap-2">
                    <div className="text-lg font-bold">Video {slot}</div>
                    <div className="text-sm text-gray-500">No description</div>
                    <button
                      className="mt-2 px-4 py-2 bg-green-600 text-white rounded-full transition-all duration-200 shadow hover:bg-green-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400"
                      onClick={() => handleOpen(slot)}
                    >
                      Add Video
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <CollectionVideoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editData || undefined}
        slotOrder={selectedSlot || 1}
      />
    </div>
  );
} 