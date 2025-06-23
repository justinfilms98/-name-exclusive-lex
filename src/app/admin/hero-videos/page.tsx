"use client";

import React, { useEffect, useState } from 'react';
import HeroVideoModal from './HeroVideoModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, CartesianGrid } from 'recharts';

interface HeroVideo {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  order: number;
  price: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  ageRating: 'G' | 'PG' | 'PG-13' | 'R';
  category: string;
  tags: string[];
  moderated: boolean;
  createdAt: string;
  updatedAt: string;
  pricing: any[];
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

type HeroVideoFormData = Omit<HeroVideo, 'id' | 'createdAt' | 'updatedAt'> & { pricing: any[] };

function PricingManagementModal({ open, onClose, video, onSave }: { open: boolean, onClose: () => void, video: HeroVideo | null, onSave: (pricing: any[]) => void }) {
  const [pricing, setPricing] = useState<any[]>(video?.pricing || []);
  useEffect(() => {
    setPricing(video?.pricing || []);
  }, [video]);

  const handleChange = (idx: number, field: string, value: any) => {
    setPricing(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };
  const handleAdd = () => {
    setPricing(prev => [...prev, { type: 'one_time', price: 0, currency: 'USD', isActive: true }]);
  };
  const handleRemove = (idx: number) => {
    setPricing(prev => prev.filter((_, i) => i !== idx));
  };
  const handleSave = () => onSave(pricing);

  if (!open || !video) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-lg relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black">&times;</button>
        <h3 className="text-xl font-bold mb-4">Manage Pricing for {video.title}</h3>
        <div className="space-y-4 mb-4">
          {pricing.map((p, idx) => (
            <div key={idx} className="border rounded p-3 mb-2">
              <div className="flex gap-2 mb-2">
                <select value={p.type} onChange={e => handleChange(idx, 'type', e.target.value)} className="border rounded px-2 py-1">
                  <option value="one_time">One-time</option>
                  <option value="subscription">Subscription</option>
                  <option value="rental">Rental</option>
                </select>
                <input type="number" value={p.price} min={0} step={0.01} onChange={e => handleChange(idx, 'price', parseFloat(e.target.value))} className="border rounded px-2 py-1 w-24" placeholder="Price" />
                <select value={p.currency} onChange={e => handleChange(idx, 'currency', e.target.value)} className="border rounded px-2 py-1">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <button onClick={() => handleRemove(idx)} className="text-red-600 ml-2">Remove</button>
              </div>
              {p.type !== 'one_time' && (
                <input type="number" value={p.duration || ''} min={1} onChange={e => handleChange(idx, 'duration', parseInt(e.target.value))} className="border rounded px-2 py-1 w-32 mb-2" placeholder="Duration (days)" />
              )}
              <input type="number" value={p.discount || ''} min={0} max={100} step={0.01} onChange={e => handleChange(idx, 'discount', parseFloat(e.target.value))} className="border rounded px-2 py-1 w-32 mb-2" placeholder="Discount (%)" />
              <input type="text" value={p.promoCode || ''} onChange={e => handleChange(idx, 'promoCode', e.target.value)} className="border rounded px-2 py-1 w-32 mb-2" placeholder="Promo Code" />
              <input type="text" value={p.region || ''} onChange={e => handleChange(idx, 'region', e.target.value)} className="border rounded px-2 py-1 w-32 mb-2" placeholder="Region (optional)" />
              <label className="inline-flex items-center ml-2">
                <input type="checkbox" checked={p.isActive !== false} onChange={e => handleChange(idx, 'isActive', e.target.checked)} className="mr-1" /> Active
              </label>
            </div>
          ))}
          <button onClick={handleAdd} className="bg-blue-100 text-blue-700 px-3 py-1 rounded">+ Add Pricing Option</button>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function HeroVideosPage() {
  const [videos, setVideos] = useState<HeroVideo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [pricingVideo, setPricingVideo] = useState<HeroVideo | null>(null);

  async function fetchVideos() {
    setLoading(true);
    try {
      const res = await fetch('/api/hero-videos');
      if (!res.ok) {
        const error: ApiError = await res.json();
        throw new Error(error.error || 'Failed to fetch videos');
      }
      const data = await res.json();
      setVideos(data.map((v: any) => ({ ...v, pricing: v.pricing || [] })));
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to fetch videos'
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics() {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/hero-videos/analytics?days=30');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const { analytics } = await res.json();
      setAnalyticsData(analytics);
    } catch (err) {
      // Optionally handle error
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    fetchVideos();
    fetchAnalytics();
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
    setModalOpen(true);
  }

  const handleSaveSuccess = () => {
    setNotification({
      type: 'success',
      message: `Video ${selectedSlot ? 'updated' : 'added'} successfully!`
    });
    fetchVideos();
  };

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

  async function handleSavePricing(pricing: any[]) {
    if (!pricingVideo) return;
    setLoading(true);
    try {
      const res = await fetch('/api/hero-videos/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: pricingVideo.id, pricing }),
      });
      if (!res.ok) throw new Error('Failed to save pricing');
      setNotification({ type: 'success', message: 'Pricing updated!' });
      setPricingModalOpen(false);
      await fetchVideos();
    } catch (err) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save pricing' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 pt-24">
      {/* Analytics Dashboard Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-2">Hero Videos Analytics (Last 30 Days)</h2>
        {analyticsLoading ? (
          <div className="text-gray-500">Loading analytics...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Total Views</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analyticsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Revenue</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analyticsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Hero Videos</h2>
        <div className="flex items-center gap-4">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-1.5"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded px-3 py-1.5"
          >
            <option value="all">All Categories</option>
            <option value="education">Education</option>
            <option value="entertainment">Entertainment</option>
            <option value="sports">Sports</option>
            <option value="music">Music</option>
            <option value="gaming">Gaming</option>
          </select>
          {loading && (
            <div className="text-sm text-gray-500">
              <span className="animate-spin mr-2">⟳</span>
              Loading...
            </div>
          )}
        </div>
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
          if (video && filterStatus !== 'all' && video.status !== filterStatus) return null;
          if (video && filterCategory !== 'all' && video.category !== filterCategory) return null;
          
          return (
            <div 
              key={slot} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col"
            >
              {video ? (
                <>
                  <div className="aspect-video mb-4 bg-gray-100 rounded-lg overflow-hidden relative group">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        video.status === 'approved' ? 'bg-green-100 text-green-800' :
                        video.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        video.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {video.ageRating}
                      </span>
                    </div>
                    {video.price > 0 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                        ${video.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">{video.category}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 line-clamp-1">{video.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{video.description}</p>
                  {video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {video.tags.map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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
                    <button 
                      onClick={() => { setPricingVideo(video); setPricingModalOpen(true); }}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                      disabled={loading}
                    >
                      Pricing
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
        onSaveSuccess={handleSaveSuccess}
        slotOrder={selectedSlot || 1}
      />

      <PricingManagementModal
        open={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        video={pricingVideo ? { ...pricingVideo, pricing: pricingVideo.pricing || [] } : null}
        onSave={handleSavePricing}
      />
    </div>
  );
} 