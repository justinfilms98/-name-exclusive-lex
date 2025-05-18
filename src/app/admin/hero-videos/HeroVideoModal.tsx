import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileObject } from '@supabase/storage-js';
import { X } from 'lucide-react';
import { uploadFile, deleteFile, type UploadProgress, type UploadType } from '@/lib/services/uploadService';

interface HeroVideo {
  id?: number;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  thumbnailPath?: string;
  videoPath?: string;
  order: number;
  price: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  ageRating: 'G' | 'PG' | 'PG-13' | 'R';
  category: string;
  tags: string[];
  moderatedBy?: string;
  moderatedAt?: Date;
  rejectionReason?: string;
  analytics?: {
    views: number;
    uniqueViews: number;
    watchTime: number;
    likes: number;
    shares: number;
    comments: number;
    revenue: number;
  };
  pricing?: {
    type: 'one_time' | 'subscription' | 'rental';
    price: number;
    currency: string;
    duration?: number;
    discount?: number;
    promoCode?: string;
    region?: string;
    isActive?: boolean;
  }[];
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

interface HeroVideoFormData {
  thumbnail: string;
  videoUrl: string;
  order: number;
  thumbnailPath?: string;
  videoPath?: string;
}

// Helper function to format watch time
const formatWatchTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export default function HeroVideoModal({ open, onClose, onSave, initialData, slotOrder }: HeroVideoModalProps) {
  const [formData, setFormData] = useState<HeroVideoFormData & { title: string; description: string }>({
    thumbnail: initialData?.thumbnail || '',
    videoUrl: initialData?.videoUrl || '',
    order: slotOrder,
    thumbnailPath: initialData?.thumbnailPath,
    videoPath: initialData?.videoPath,
    title: initialData?.title || '',
    description: initialData?.description || '',
  });
  const [uploadProgress, setUploadProgress] = useState<Record<UploadType, UploadProgress>>({
    thumbnail: { progress: 0, status: 'complete' },
    video: { progress: 0, status: 'complete' },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const thumbnailInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setFormData({
        thumbnail: initialData?.thumbnail || '',
        videoUrl: initialData?.videoUrl || '',
        order: slotOrder,
        thumbnailPath: initialData?.thumbnailPath,
        videoPath: initialData?.videoPath,
        title: initialData?.title || '',
        description: initialData?.description || '',
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: UploadType) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadProgress(prev => ({
      ...prev,
      [type]: { progress: 0, status: 'uploading' }
    }));

    try {
      // Delete old file if exists
      const oldPath = type === 'thumbnail' ? formData.thumbnailPath : formData.videoPath;
      if (oldPath) {
        await deleteFile(oldPath, type);
      }

      // Upload new file
      const result = await uploadFile(file, type, slotOrder, (progress) => {
        setUploadProgress(prev => ({
          ...prev,
          [type]: progress
        }));
      });

      // Update form data
      setFormData(prev => ({
        ...prev,
        [type === 'thumbnail' ? 'thumbnail' : 'videoUrl']: result.url,
        [type === 'thumbnail' ? 'thumbnailPath' : 'videoPath']: result.path,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress(prev => ({
        ...prev,
        [type]: { progress: 0, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.thumbnail || !formData.videoUrl) {
        throw new Error('Thumbnail and video are required');
      }
      if (!formData.title.trim() || !formData.description.trim()) {
        throw new Error('Title and description are required');
      }

      await onSave({
        ...formData,
        status: 'draft',
        price: 0,
        ageRating: 'PG',
        category: 'general',
        tags: [],
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save hero video');
    } finally {
      setSaving(false);
    }
  }

  const isUploading = Object.values(uploadProgress).some(p => p.status === 'uploading');
  const hasError = Object.values(uploadProgress).some(p => p.status === 'error');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg relative">
        <button type="button" onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black" disabled={isUploading || saving}>&times;</button>
        <h3 className="text-xl font-bold mb-4">{initialData ? 'Edit' : 'Add'} Hero Video</h3>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">Hero video saved successfully!</div>}
        {hasError && (
          <div className="mb-4 p-3 bg-red-200 text-red-800 rounded">A file upload failed. Please try again or check your Supabase storage settings.</div>
        )}
        
        <div className="mb-4">
          <label className="block font-semibold mb-1">Thumbnail</label>
          <input 
            type="file" 
            accept="image/*" 
            ref={thumbnailInput} 
            onChange={e => handleFileUpload(e, 'thumbnail')} 
            className="mb-2" 
            disabled={isUploading || saving} 
          />
          {uploadProgress.thumbnail.status === 'uploading' && (
            <div className="mb-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-600 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress.thumbnail.progress}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Uploading thumbnail... {Math.round(uploadProgress.thumbnail.progress)}%
              </div>
            </div>
          )}
          {uploadProgress.thumbnail.status === 'error' && (
            <div className="mb-2 text-sm text-red-600">{uploadProgress.thumbnail.error}</div>
          )}
          {formData.thumbnail && (
            <img src={formData.thumbnail} alt="Thumbnail" className="w-32 h-20 object-cover rounded" />
          )}
        </div>
        
        <div className="mb-4">
          <label className="block font-semibold mb-1">Video File</label>
          <input 
            type="file" 
            accept="video/*" 
            ref={videoInput} 
            onChange={e => handleFileUpload(e, 'video')} 
            className="mb-2" 
            disabled={isUploading || saving} 
          />
          {uploadProgress.video.status === 'uploading' && (
            <div className="mb-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-600 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress.video.progress}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Uploading video... {Math.round(uploadProgress.video.progress)}%
              </div>
            </div>
          )}
          {uploadProgress.video.status === 'error' && (
            <div className="mb-2 text-sm text-red-600">{uploadProgress.video.error}</div>
          )}
          {formData.videoUrl && (
            <video src={formData.videoUrl} controls className="w-32 h-20 rounded" />
          )}
        </div>
        
        <div className="mb-4">
          <label className="block font-semibold mb-1">Title</label>
          <input
            className="w-full border rounded px-3 py-2 mb-4"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
            disabled={isUploading || saving}
          />
        </div>
        
        <div className="mb-4">
          <label className="block font-semibold mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2 mb-4"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
            disabled={isUploading || saving}
          />
        </div>
        
        <button 
          type="submit" 
          className={`w-full py-2 rounded text-white ${
            isUploading || saving || hasError 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`} 
          disabled={isUploading || saving || hasError}
        >
          {isUploading ? 'Uploading...' : saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
} 