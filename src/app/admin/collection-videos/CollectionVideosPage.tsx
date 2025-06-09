import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { uploadFile } from '@/lib/services/uploadService';
// import { toast } from '@/components/Toast'; // Placeholder for toast notifications

// Dummy data structure for now
interface CollectionVideo {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  thumbnail_url: string;
  video_url: string;
  created_at?: string;
  creator_id?: string;
  collection?: string;
  order?: number;
  category?: string;
  pricing?: { type: string; price: number; currency: string; isActive: boolean }[];
}

// Add these defaults/constants at the top
const DEFAULT_CATEGORY = 'general';
const DEFAULT_COLLECTION = 'main';
const DEFAULT_PRICING = [{ type: 'one_time', price: 0, currency: 'USD', isActive: true }];
const SLOTS = 8;

export default function CollectionVideosPage() {
  const [videos, setVideos] = useState<CollectionVideo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: 0,
    duration: 0,
    thumbnail_url: '',
    video_url: '',
    collection: DEFAULT_COLLECTION,
    order: 0,
    category: DEFAULT_CATEGORY,
    pricing: DEFAULT_PRICING,
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/collection-videos');
      const data = await res.json();
      if (res.ok) setVideos(data);
      else setError(data.error || 'Failed to fetch videos');
    } catch (err) {
      setError('Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setForm({ title: '', description: '', price: 0, duration: 0, thumbnail_url: '', video_url: '', collection: DEFAULT_COLLECTION, order: 0, category: DEFAULT_CATEGORY, pricing: DEFAULT_PRICING });
    setThumbnailFile(null);
    setVideoFile(null);
    setEditId(null);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setThumbnailFile(files[0]);
      setForm(prev => ({ ...prev, thumbnail_url: URL.createObjectURL(files[0]) }));
    }
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setVideoFile(files[0]);
      setForm(prev => ({ ...prev, video_url: URL.createObjectURL(files[0]) }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let thumbnailUrl = form.thumbnail_url;
      let videoUrl = form.video_url;
      if (thumbnailFile) {
        const upload = await uploadFile(thumbnailFile, 'thumbnail', Date.now());
        thumbnailUrl = upload.url;
      }
      if (videoFile) {
        const upload = await uploadFile(videoFile, 'video', Date.now());
        videoUrl = upload.url;
      }
      const payload = {
        collection: form.collection || DEFAULT_COLLECTION,
        title: form.title,
        description: form.description,
        thumbnail: thumbnailUrl,
        videoUrl: videoUrl,
        order: Number(form.order) || slots.find(slot => !videos.find(v => v.order === slot)) || 1,
        category: form.category || DEFAULT_CATEGORY,
        pricing: (form.pricing && Array.isArray(form.pricing) && form.pricing.length > 0)
          ? form.pricing.map(p => ({
              type: p.type || 'one_time',
              price: Number(p.price) || 0,
              currency: p.currency || 'USD',
              isActive: typeof p.isActive === 'boolean' ? p.isActive : true
            }))
          : [{ type: 'one_time', price: Number(form.price) || 0, currency: 'USD', isActive: true }],
        duration: Number(form.duration),
        price: Number(form.price),
      };
      if (editId) {
        const res = await fetch('/api/collection-videos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: Number(editId), ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update video');
        setVideos(prev => prev.map(v => v.id === editId ? data : v));
      } else {
        const res = await fetch('/api/collection-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save video');
        setVideos(prev => [data, ...prev]);
      }
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save video');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    const video = videos.find(v => v.id === id);
    if (video) {
      setForm({
        title: video.title,
        description: video.description,
        price: video.price,
        duration: video.duration,
        thumbnail_url: video.thumbnail_url,
        video_url: video.video_url,
        collection: video.collection || DEFAULT_COLLECTION,
        order: video.order || 1,
        category: video.category || DEFAULT_CATEGORY,
        pricing: video.pricing || DEFAULT_PRICING,
      });
      setEditId(id);
      setShowModal(true);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // Use query string for DELETE to match API expectations
      const res = await fetch(`/api/collection-videos?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete video');
      setVideos(prev => prev.filter(v => v.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete video');
    } finally {
      setLoading(false);
    }
  };

  // Replace the videos display with 8 slots
  const slots = Array.from({ length: SLOTS }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-brand-mist py-8 px-4">
      <h2 className="text-3xl font-serif text-brand-pine mb-8">Manage Collection Videos</h2>
      <button className="bg-brand-tan text-white px-4 py-2 rounded hover:bg-brand-earth transition mb-6" onClick={() => { resetForm(); setShowModal(true); }}>Add Video</button>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
        {slots.map((slot) => {
          const video = videos.find(v => v.order === slot);
          return (
            <div key={slot} className="bg-brand-almond rounded-lg shadow p-4 flex flex-col items-center min-h-[340px] transition-transform hover:scale-105 hover:shadow-xl">
              {video ? (
                <>
                  <img src={video.thumbnail_url} alt={video.title} className="w-full h-32 object-cover rounded mb-3" />
                  <h3 className="text-lg font-serif text-brand-pine mb-1 text-center truncate w-full">{video.title}</h3>
                  <p className="text-brand-earth text-sm mb-2 text-center line-clamp-2">{video.description}</p>
                  <p className="text-brand-tan font-bold mb-2">${video.price}</p>
                  <p className="text-brand-sage text-xs mb-2">Duration: {video.duration} min</p>
                  <div className="flex gap-2 mt-auto w-full">
                    <button className="bg-brand-pine text-white px-3 py-1 rounded shadow hover:bg-brand-earth focus:outline-none focus:ring-2 focus:ring-brand-tan transition w-1/2" onClick={() => handleEdit(video.id)}>Edit</button>
                    <button className="bg-brand-pine text-white px-3 py-1 rounded shadow hover:bg-brand-earth focus:outline-none focus:ring-2 focus:ring-brand-tan transition w-1/2" onClick={() => handleDelete(video.id)}>Delete</button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="w-20 h-20 bg-brand-mist rounded-full flex items-center justify-center mb-2">
                      <span className="text-3xl text-brand-sage">+</span>
                    </div>
                    <p className="text-brand-sage text-sm mb-2 text-center">No video in this slot</p>
                  </div>
                  <button className="bg-brand-pine text-white px-4 py-2 rounded shadow hover:bg-brand-earth focus:outline-none focus:ring-2 focus:ring-brand-tan transition w-full" onClick={() => { resetForm(); setShowModal(true); setForm(f => ({ ...f, order: slot })); }}>Add Video</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg relative">
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="absolute top-2 right-2 text-gray-500 hover:text-black">&times;</button>
            <h3 className="text-xl font-bold mb-4">{editId ? 'Edit' : 'Add'} Collection Video</h3>
            <div className="mb-3">
              <label className="block text-brand-pine font-serif mb-1">Title</label>
              <input name="title" value={form.title} onChange={handleInputChange} required className="w-full border border-brand-sage rounded px-2 py-1" />
            </div>
            <div className="mb-3">
              <label className="block text-brand-pine font-serif mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleInputChange} required className="w-full border border-brand-sage rounded px-2 py-1" />
            </div>
            <div className="mb-3">
              <label className="block text-brand-pine font-serif mb-1">Price ($)</label>
              <input name="price" type="number" value={form.price} onChange={handleInputChange} required min={0} className="w-full border border-brand-sage rounded px-2 py-1" />
            </div>
            <div className="mb-3">
              <label className="block text-brand-pine font-serif mb-1">Duration (minutes)</label>
              <input name="duration" type="number" value={form.duration} onChange={handleInputChange} required min={1} className="w-full border border-brand-sage rounded px-2 py-1" />
            </div>
            <div className="mb-3">
              <label className="block text-brand-pine font-serif mb-1">Thumbnail</label>
              <input type="file" accept="image/*" onChange={handleThumbnailChange} required={!editId} className="w-full" />
              {form.thumbnail_url && <img src={form.thumbnail_url} alt="thumbnail preview" className="w-20 mt-2 rounded" />}
            </div>
            <div className="mb-3">
              <label className="block text-brand-pine font-serif mb-1">Video File</label>
              <input type="file" accept="video/*" onChange={handleVideoChange} required={!editId} className="w-full" />
              {form.video_url && <video src={form.video_url} controls className="w-32 mt-2 rounded" />}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="bg-brand-tan text-white px-4 py-2 rounded hover:bg-brand-earth transition" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
              <button type="button" className="bg-brand-sage text-white px-4 py-2 rounded hover:bg-brand-earth transition" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 