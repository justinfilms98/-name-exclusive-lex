import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadFile, deleteFile, type UploadProgress, type UploadType } from '@/lib/services/uploadService';

interface CollectionVideo {
  id?: number;
  collection: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  thumbnailPath?: string;
  videoPath?: string;
  order: number;
  category: string;
  ageRating: 'G' | 'PG' | 'PG-13' | 'R';
  tags: string[];
  pricing: {
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

interface CollectionVideoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<CollectionVideo, 'id'>) => Promise<void>;
  initialData?: CollectionVideo | null;
  slotOrder: number;
}

export default function CollectionVideoModal({ open, onClose, onSave, initialData, slotOrder }: CollectionVideoModalProps) {
  const [formData, setFormData] = useState<CollectionVideo>({
    collection: initialData?.collection || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    thumbnail: initialData?.thumbnail || '',
    videoUrl: initialData?.videoUrl || '',
    thumbnailPath: initialData?.thumbnailPath,
    videoPath: initialData?.videoPath,
    order: slotOrder,
    category: initialData?.category || 'general',
    ageRating: initialData?.ageRating || 'PG',
    tags: initialData?.tags || [],
    pricing: initialData?.pricing || [{
      type: 'one_time',
      price: 0,
      currency: 'USD',
      isActive: true,
    }],
  });

  const [uploadProgress, setUploadProgress] = useState<Record<UploadType, UploadProgress>>({
    thumbnail: { progress: 0, status: 'complete' },
    video: { progress: 0, status: 'complete' },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newTag, setNewTag] = useState('');
  const thumbnailInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setFormData({
        collection: initialData?.collection || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        thumbnail: initialData?.thumbnail || '',
        videoUrl: initialData?.videoUrl || '',
        thumbnailPath: initialData?.thumbnailPath,
        videoPath: initialData?.videoPath,
        order: slotOrder,
        category: initialData?.category || 'general',
        ageRating: initialData?.ageRating || 'PG',
        tags: initialData?.tags || [],
        pricing: initialData?.pricing || [{
          type: 'one_time',
          price: 0,
          currency: 'USD',
          isActive: true,
        }],
      });
      setError(null);
      setSuccess(false);
      setNewTag('');
    }
  }, [open, initialData, slotOrder]);

  if (!open) return null;

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

  function handleAddTag() {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  }

  function handleRemoveTag(tag: string) {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }

  function handlePricingChange(index: number, field: keyof CollectionVideo['pricing'][0], value: any) {
    setFormData(prev => ({
      ...prev,
      pricing: prev.pricing.map((price, i) => 
        i === index ? { ...price, [field]: value } : price
      )
    }));
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

      await onSave(formData);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save collection video');
    } finally {
      setSaving(false);
    }
  }

  const isUploading = Object.values(uploadProgress).some(p => p.status === 'uploading');
  const hasError = Object.values(uploadProgress).some(p => p.status === 'error');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 w-full max-w-2xl shadow-lg relative max-h-[90vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black" disabled={isUploading || saving}>&times;</button>
        <h3 className="text-xl font-bold mb-4">{initialData ? 'Edit' : 'Add'} Collection Video</h3>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">Video saved successfully!</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block font-semibold mb-1">Collection</label>
            <input 
              className="w-full border rounded px-3 py-2" 
              value={formData.collection} 
              onChange={e => setFormData(prev => ({ ...prev, collection: e.target.value }))} 
              required 
              disabled={isUploading || saving} 
            />
          </div>
          
          <div className="mb-4">
            <label className="block font-semibold mb-1">Title</label>
            <input 
              className="w-full border rounded px-3 py-2" 
              value={formData.title} 
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} 
              required 
              disabled={isUploading || saving} 
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block font-semibold mb-1">Description</label>
          <textarea 
            className="w-full border rounded px-3 py-2" 
            value={formData.description} 
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} 
            required 
            disabled={isUploading || saving} 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        
        <div className="flex justify-end gap-2">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isUploading || saving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={`px-4 py-2 rounded text-white ${
              isUploading || saving || hasError 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isUploading || saving || hasError}
          >
            {isUploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Video'}
          </button>
        </div>
      </form>
    </div>
  );
} 