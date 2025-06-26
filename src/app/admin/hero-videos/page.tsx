"use client";

import React, { useEffect, useState } from 'react';
import HeroVideoModal from './HeroVideoModal';
import HeroUploadWidget from '@/components/HeroUploadWidget';
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

  const handleSavePricing = async (pricing: any[]) => {
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
  };

  const handleUploadComplete = (videoUrl: string) => {
    setNotification({
      type: 'success',
      message: 'Video uploaded successfully!'
    });
    fetchVideos();
  };

  const handleUploadError = (error: string) => {
    setNotification({
      type: 'error',
      message: error
    });
  };

  return (
    <div className="pt-8">
      {/* Page header */}
      <div className="flex justify-between items-center mb-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Manage Hero Videos</h1>
        <button
          onClick={() => handleOpen(0)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700"
        >
          Add Hero Video
        </button>
      </div>
      
      {/* Notification */}
      {notification && (
        <div className={`px-4 sm:px-6 lg:px-8 mb-4`}>
          <div className={`p-4 rounded-md ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        </div>
      )}
      
      {/* Upload Widget */}
      <div className="px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New Hero Video</h2>
          <HeroUploadWidget 
            onUploadComplete={handleUploadComplete}
            onError={handleUploadError}
          />
        </div>
      </div>
      
      {/* Video List */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
          {/* Video list will go here */}
        </div>
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