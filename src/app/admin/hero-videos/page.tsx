"use client";

import React, { useEffect, useState } from 'react';
import HeroVideoModal from './HeroVideoModal';

interface HeroVideo {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiError {
  error: string;
  details?: Array<{ path: string[]; message: string }>;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
  details?: string[];
}

export default function HeroVideosPage() {
  const [videos, setVideos] = useState<HeroVideo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [editData, setEditData] = useState<HeroVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  async function fetchVideos() {
    setLoading(true);
    try {
      const res = await fetch('/api/hero-videos');
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw new Error(error.error || 'Failed to fetch videos');
      }
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch videos'
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVideos();
  }, []);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  function handleOpen(slot: number, video?: HeroVideo) {
    setSelectedSlot(slot);
    setEditData(video || null);
    setModalOpen(true);
  }

  async function handleSave(data: HeroVideo) {
    setLoading(true);
    try {
      const url = '/api/hero-videos';
      const method = editData ? 'PUT' : 'POST';
      const body = editData ? { ...editData, ...data } : data;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const responseData = await res.json();

      if (!res.ok) {
        const error: ApiError = responseData;
        throw new Error(
          error.details 
            ? error.details.map(d => `${d.path.join('.')}: ${d.message}`).join('\n')
            : error.error || 'Failed to save video'
        );
      }

      setNotification({
        type: 'success',
        message: `Video ${editData ? 'updated' : 'added'} successfully!`
      });
      
      setModalOpen(false);
      await fetchVideos();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save video'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(video: HeroVideo) {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/hero-videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: video.id }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        const error: ApiError = responseData;
        throw new Error(error.error || 'Failed to delete video');
      }

      setNotification({
        type: 'success',
        message: 'Video deleted successfully!'
      });
      
      await fetchVideos();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to delete video'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Hero Videos</h2>
        {loading && (
          <div className="text-sm text-gray-500">
            <span className="animate-spin mr-2">⟳</span>
            Loading...
          </div>
        )}
      </div>

      {notification && (
        <div 
          className={`mb-6 p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="font-medium">{notification.message}</div>
          {notification.details && notification.details.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-sm">
              {notification.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((slot) => {
          const video = videos.find(v => v.order === slot);
          return (
            <div 
              key={slot} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col"
            >
              {video ? (
                <>
                  <div className="aspect-video mb-4 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 line-clamp-1">{video.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{video.description}</p>
                  <div className="mt-auto flex gap-2">
                    <button 
                      onClick={() => handleOpen(slot, video)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      disabled={loading}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(video)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="aspect-video mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">No Video</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Hero Video {slot}</h3>
                  <p className="text-sm text-gray-600 mb-4">This slot is available</p>
                  <button 
                    onClick={() => handleOpen(slot)}
                    className="mt-auto w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    disabled={loading}
                  >
                    Add Video
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <HeroVideoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editData}
        slotOrder={selectedSlot || 1}
      />
    </div>
  );
} 