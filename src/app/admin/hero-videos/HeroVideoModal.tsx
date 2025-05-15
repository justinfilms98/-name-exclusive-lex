import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface HeroVideo {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

interface HeroVideoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<HeroVideo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: HeroVideo | null;
  slotOrder: number;
}

interface UploadError {
  message: string;
  field?: 'thumbnail' | 'video';
}

type HeroVideoFormData = Omit<HeroVideo, 'id' | 'createdAt' | 'updatedAt'>;

export default function HeroVideoModal({ open, onClose, onSave, initialData, slotOrder }: HeroVideoModalProps) {
  const [formData, setFormData] = useState<HeroVideoFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    thumbnail: initialData?.thumbnail || '',
    videoUrl: initialData?.videoUrl || '',
    order: slotOrder,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const [success, setSuccess] = useState(false);
  const thumbnailInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setFormData({
        title: initialData?.title || '',
        description: initialData?.description || '',
        thumbnail: initialData?.thumbnail || '',
        videoUrl: initialData?.videoUrl || '',
        order: slotOrder,
      });
      setError(null);
      setSuccess(false);
    }
  }, [open, initialData, slotOrder]);

  if (!open) return null;

  const validateFile = (file: File, type: 'image' | 'video'): string | null => {
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 100 * 1024 * 1024; // 5MB for images, 100MB for videos
    if (file.size > maxSize) {
      return `File size must be less than ${type === 'image' ? '5MB' : '100MB'}`;
    }
    return null;
  };

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file, 'image');
    if (validationError) {
      setError({ message: validationError, field: 'thumbnail' });
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const { data, error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(`hero-${slotOrder}-${file.name}`, file, { upsert: true });

      if (uploadError) throw uploadError;

      if (data) {
        const url = supabase.storage.from('thumbnails').getPublicUrl(data.path).data.publicUrl;
        setFormData(prev => ({ ...prev, thumbnail: url }));
      }
    } catch (err) {
      setError({ 
        message: err instanceof Error ? err.message : 'Failed to upload thumbnail',
        field: 'thumbnail'
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file, 'video');
    if (validationError) {
      setError({ message: validationError, field: 'video' });
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(`hero-${slotOrder}-${file.name}`, file, { upsert: true });

      if (uploadError) throw uploadError;

      if (data) {
        const url = supabase.storage.from('videos').getPublicUrl(data.path).data.publicUrl;
        setFormData(prev => ({ ...prev, videoUrl: url }));
      }
    } catch (err) {
      setError({ 
        message: err instanceof Error ? err.message : 'Failed to upload video',
        field: 'video'
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await onSave(formData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError({ 
        message: err instanceof Error ? err.message : 'Failed to save hero video'
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg relative">
        <button 
          type="button" 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          disabled={uploading || saving}
        >
          &times;
        </button>
        
        <h3 className="text-xl font-bold mb-4">{initialData ? 'Edit' : 'Add'} Hero Video</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error.message}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            Hero video saved successfully!
          </div>
        )}

        <div className="mb-4">
          <label className="block font-semibold mb-1">Title</label>
          <input 
            className="w-full border rounded px-3 py-2" 
            value={formData.title} 
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} 
            required 
            disabled={uploading || saving}
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Description</label>
          <textarea 
            className="w-full border rounded px-3 py-2" 
            value={formData.description} 
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} 
            required 
            disabled={uploading || saving}
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Thumbnail</label>
          <input 
            type="file" 
            accept="image/*" 
            ref={thumbnailInput} 
            onChange={handleThumbnailUpload} 
            className="mb-2"
            disabled={uploading || saving}
          />
          {formData.thumbnail && (
            <img 
              src={formData.thumbnail} 
              alt="Thumbnail" 
              className="w-32 h-20 object-cover rounded" 
            />
          )}
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Video File</label>
          <input 
            type="file" 
            accept="video/*" 
            ref={videoInput} 
            onChange={handleVideoUpload} 
            className="mb-2"
            disabled={uploading || saving}
          />
          {formData.videoUrl && (
            <video 
              src={formData.videoUrl} 
              controls 
              className="w-32 h-20 rounded"
            />
          )}
        </div>

        <button 
          type="submit" 
          className={`w-full py-2 rounded text-white ${
            uploading || saving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={uploading || saving}
        >
          {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
} 