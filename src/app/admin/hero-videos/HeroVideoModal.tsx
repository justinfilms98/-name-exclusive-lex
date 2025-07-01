"use client";
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface HeroVideoModalProps {
  open: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  slotOrder: number;
  initialData?: { title?: string; subtitle?: string; videoUrl?: string };
}

export default function HeroVideoModal({ open, onClose, onSaveSuccess, slotOrder, initialData }: HeroVideoModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTitle(initialData?.title || '');
      setSubtitle(initialData?.subtitle || '');
      setVideoUrl(initialData?.videoUrl || '');
      setError(null);
      setVideoError(null);
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleUploadComplete = (file: any) => {
    // file.url or file.variants[0].url
    let url = file?.url || (file?.variants && file.variants[0]?.url) || '';
    setVideoUrl(url);
    setVideoError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVideoError(null);
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!videoUrl) {
      setVideoError('A video file is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/hero-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          videoUrl,
          order: slotOrder,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save hero video.');
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 pt-20">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-full overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif text-stone-800">Add Hero Video</h2>
            <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-800">
              <X size={24} />
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700">Subtitle (optional)</label>
              <input
                type="text"
                id="subtitle"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Video File</label>
              {/* TODO: Integrate UploadThing upload button here if needed. */}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors">
              {isSubmitting ? 'Saving...' : 'Save Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 