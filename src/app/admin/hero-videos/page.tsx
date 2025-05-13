import React, { useEffect, useState } from 'react';
import HeroVideoModal from './HeroVideoModal';

interface HeroVideo {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  order: number;
}

export default function HeroVideosPage() {
  const [videos, setVideos] = useState<HeroVideo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [editData, setEditData] = useState<HeroVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function fetchVideos() {
    setLoading(true);
    fetch('/api/hero-videos')
      .then(res => res.json())
      .then(setVideos)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchVideos();
  }, []);

  function handleOpen(slot: number, video?: HeroVideo) {
    setSelectedSlot(slot);
    setEditData(video || null);
    setModalOpen(true);
  }

  async function handleSave(data: any) {
    setLoading(true);
    setModalOpen(false);
    try {
      if (editData) {
        // Update existing
        const res = await fetch('/api/hero-videos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editData, ...data, id: editData.id }),
        });
        if (!res.ok) throw new Error('Failed to update video');
      } else {
        // Create new
        const res = await fetch('/api/hero-videos', {
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

  async function handleDelete(video: HeroVideo) {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hero-videos', {
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

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Manage Hero Videos</h2>
      {notification && (
        <div className={`mb-4 p-3 rounded text-center ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{notification.message}</div>
      )}
      {loading && <div className="mb-4 text-center">Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((slot) => {
          const video = videos.find(v => v.order === slot);
          return (
            <div key={slot} className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              {video ? (
                <>
                  <img src={video.thumbnail} alt={video.title} className="w-32 h-20 object-cover rounded mb-2" />
                  <div className="text-lg font-semibold mb-1">{video.title}</div>
                  <div className="text-sm text-gray-500 mb-2">{video.description}</div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => handleOpen(slot, video)}>Edit / Upload</button>
                    <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={() => handleDelete(video)}>Delete</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-32 h-20 bg-gray-200 rounded mb-2 flex items-center justify-center">No Video</div>
                  <div className="text-lg font-semibold mb-1">Hero Video {slot}</div>
                  <div className="text-sm text-gray-500 mb-2">No description</div>
                  <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={() => handleOpen(slot)}>Add Video</button>
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