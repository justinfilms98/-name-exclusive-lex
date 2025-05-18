import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadFile, deleteFile, type UploadProgress, type UploadType } from '@/lib/services/uploadService';

interface PricingOption {
  type: 'one_time' | 'subscription' | 'rental';
  price: number;
  currency: string;
  duration?: number;
  discount?: number;
  promoCode?: string;
  region?: string;
  isActive?: boolean;
}

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
  pricing: PricingOption[];
}

interface CollectionVideoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<CollectionVideo, 'id'>) => Promise<void>;
  initialData?: CollectionVideo | null;
  slotOrder: number;
}

const AGE_RATINGS = ['G', 'PG', 'PG-13', 'R'] as const;
const PRICING_TYPES = ['one_time', 'subscription', 'rental'] as const;

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
    category: initialData?.category || '',
    ageRating: initialData?.ageRating || 'PG',
    tags: initialData?.tags || [],
    pricing: initialData?.pricing || [{ type: 'one_time', price: 0, currency: 'USD', isActive: true }],
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
        collection: initialData?.collection || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        thumbnail: initialData?.thumbnail || '',
        videoUrl: initialData?.videoUrl || '',
        thumbnailPath: initialData?.thumbnailPath,
        videoPath: initialData?.videoPath,
        order: slotOrder,
        category: initialData?.category || '',
        ageRating: initialData?.ageRating || 'PG',
        tags: initialData?.tags || [],
        pricing: initialData?.pricing || [{ type: 'one_time', price: 0, currency: 'USD', isActive: true }],
      });
      setError(null);
      setSuccess(false);
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
      // Mark upload as complete so UI unfreezes
      setUploadProgress(prev => ({
        ...prev,
        [type]: { progress: 100, status: 'complete' }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress(prev => ({
        ...prev,
        [type]: { progress: 0, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
      }));
    }
  }

  function handleTagAdd(tag: string) {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  }
  function handleTagRemove(tag: string) {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  }

  function handlePricingChange(idx: number, field: keyof PricingOption, value: any) {
    setFormData(prev => ({
      ...prev,
      pricing: prev.pricing.map((p, i) => i === idx ? { ...p, [field]: value } : p)
    }));
  }
  function handleAddPricing() {
    setFormData(prev => ({
      ...prev,
      pricing: [...prev.pricing, { type: 'one_time', price: 0, currency: 'USD', isActive: true }]
    }));
  }
  function handleRemovePricing(idx: number) {
    setFormData(prev => ({
      ...prev,
      pricing: prev.pricing.filter((_, i) => i !== idx)
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
      if (!formData.category) {
        throw new Error('Category is required');
      }
      if (!formData.pricing.length) {
        throw new Error('At least one pricing option is required');
      }
      await onSave({ ...formData });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      if (err?.response?.json) {
        const json = await err.response.json();
        setError(json?.error || 'Failed to save collection video');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save collection video');
      }
    } finally {
      setSaving(false);
    }
  }

  const isUploading = Object.values(uploadProgress).some(p => p.status === 'uploading');
  const hasError = Object.values(uploadProgress).some(p => p.status === 'error');

  // For tag input
  const [tagInput, setTagInput] = useState('');

  // Determine if uploads are complete
  const uploadsComplete = uploadProgress.thumbnail.status === 'complete' && uploadProgress.video.status === 'complete';
  const uploadsStarted = uploadProgress.thumbnail.status !== 'complete' || uploadProgress.video.status !== 'complete';

  // Determine if all required fields are filled
  const requiredFieldsFilled = formData.collection && formData.title && formData.description && formData.thumbnail && formData.videoUrl && formData.category && formData.pricing.length > 0;

  // Only allow editing fields after both uploads are complete
  const fieldsDisabled = !uploadsComplete || isUploading || saving;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 w-full max-w-2xl shadow-lg relative max-h-[90vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black" disabled={isUploading || saving}>&times;</button>
        <h3 className="text-xl font-bold mb-4">{initialData ? 'Edit' : 'Add'} Collection Video</h3>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">Video saved successfully!</div>}
        {hasError && (
          <div className="mb-4 p-3 bg-red-200 text-red-800 rounded">A file upload failed. Please try again or check your Supabase storage settings.</div>
        )}
        {/* Show upload success after both uploads complete */}
        {uploadsComplete && !initialData && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">Upload successful! Please fill in the video details below and save.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block font-semibold mb-1">Collection</label>
            <input 
              className="w-full border rounded px-3 py-2" 
              value={formData.collection} 
              onChange={e => setFormData(prev => ({ ...prev, collection: e.target.value }))} 
              required 
              disabled={fieldsDisabled} 
            />
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Title</label>
            <input 
              className="w-full border rounded px-3 py-2" 
              value={formData.title} 
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} 
              required 
              disabled={fieldsDisabled} 
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
            disabled={fieldsDisabled} 
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
              disabled={isUploading || saving || uploadProgress.thumbnail.status === 'uploading'} 
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
              disabled={isUploading || saving || uploadProgress.video.status === 'uploading'} 
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block font-semibold mb-1">Category</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={formData.category}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              required
              disabled={fieldsDisabled}
            />
          </div>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Age Rating</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.ageRating}
              onChange={e => setFormData(prev => ({ ...prev, ageRating: e.target.value as any }))}
              disabled={fieldsDisabled}
            >
              {['G', 'PG', 'PG-13', 'R'].map(rating => (
                <option key={rating} value={rating}>{rating}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map(tag => (
              <span key={tag} className="bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                {tag}
                <button type="button" className="ml-1 text-xs text-red-500" onClick={() => handleTagRemove(tag)} disabled={fieldsDisabled}>×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                  e.preventDefault();
                  handleTagAdd(tagInput.trim());
                  setTagInput('');
                }
              }}
              placeholder="Add tag and press Enter"
              disabled={fieldsDisabled}
            />
            <button
              type="button"
              className="bg-green-600 text-white px-3 py-2 rounded"
              onClick={() => { if (tagInput.trim()) { handleTagAdd(tagInput.trim()); setTagInput(''); } }}
              disabled={fieldsDisabled}
            >Add</button>
          </div>
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Pricing Options</label>
          {formData.pricing.map((pricing, idx) => (
            <div key={idx} className="border rounded p-4 mb-2 flex flex-col gap-2 relative bg-gray-50">
              <button
                type="button"
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg"
                onClick={() => handleRemovePricing(idx)}
                disabled={formData.pricing.length === 1 || fieldsDisabled}
                title="Remove pricing option"
              >×</button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">Type</label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={pricing.type}
                    onChange={e => handlePricingChange(idx, 'type', e.target.value)}
                    disabled={fieldsDisabled}
                  >
                    {['one_time', 'subscription', 'rental'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Price</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={pricing.price}
                    min={0}
                    step={0.01}
                    onChange={e => handlePricingChange(idx, 'price', parseFloat(e.target.value))}
                    disabled={fieldsDisabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Currency</label>
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={pricing.currency}
                    maxLength={3}
                    onChange={e => handlePricingChange(idx, 'currency', e.target.value.toUpperCase())}
                    disabled={fieldsDisabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Duration (days, for rental/subscription)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={pricing.duration || ''}
                    min={0}
                    onChange={e => handlePricingChange(idx, 'duration', e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={fieldsDisabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Discount (%)</label>
                  <input
                    type="number"
                    className="w-full border rounded px-2 py-1"
                    value={pricing.discount || ''}
                    min={0}
                    max={100}
                    onChange={e => handlePricingChange(idx, 'discount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    disabled={fieldsDisabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Promo Code</label>
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={pricing.promoCode || ''}
                    onChange={e => handlePricingChange(idx, 'promoCode', e.target.value)}
                    disabled={fieldsDisabled}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Region</label>
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={pricing.region || ''}
                    onChange={e => handlePricingChange(idx, 'region', e.target.value)}
                    disabled={fieldsDisabled}
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={pricing.isActive !== false}
                    onChange={e => handlePricingChange(idx, 'isActive', e.target.checked)}
                    disabled={fieldsDisabled}
                  />
                  <label className="text-sm">Active</label>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
            onClick={handleAddPricing}
            disabled={fieldsDisabled}
          >Add Pricing Option</button>
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
              isUploading || saving || hasError || !uploadsComplete || !requiredFieldsFilled
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isUploading || saving || hasError || !uploadsComplete || !requiredFieldsFilled}
          >
            {isUploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Video'}
          </button>
        </div>
      </form>
    </div>
  );
} 