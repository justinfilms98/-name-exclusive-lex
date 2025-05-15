import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileObject } from '@supabase/storage-js';
import { X } from 'lucide-react';

interface HeroVideo {
  id?: number;
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

interface UploadProgress {
  thumbnail?: number;
  video?: number;
}

type HeroVideoFormData = Omit<HeroVideo, 'id' | 'createdAt' | 'updatedAt'>;

// Helper function to format watch time
const formatWatchTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export default function HeroVideoModal({ open, onClose, onSave, initialData, slotOrder }: HeroVideoModalProps) {
  const [formData, setFormData] = useState<HeroVideo>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    thumbnail: initialData?.thumbnail || '',
    videoUrl: initialData?.videoUrl || '',
    order: slotOrder,
    price: initialData?.price || 0,
    status: initialData?.status || 'draft',
    ageRating: initialData?.ageRating || 'PG',
    category: initialData?.category || 'entertainment',
    tags: initialData?.tags || [],
    rejectionReason: initialData?.rejectionReason || '',
    pricing: initialData?.pricing || [{
      type: 'one_time',
      price: initialData?.price || 0,
      currency: 'USD',
      isActive: true
    }]
  });
  const [uploading, setUploading] = useState<'thumbnail' | 'video' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const [success, setSuccess] = useState(false);
  const [newTag, setNewTag] = useState('');
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
        price: initialData?.price || 0,
        status: initialData?.status || 'draft',
        ageRating: initialData?.ageRating || 'PG',
        category: initialData?.category || 'entertainment',
        tags: initialData?.tags || [],
        rejectionReason: initialData?.rejectionReason || '',
        pricing: initialData?.pricing || [{
          type: 'one_time',
          price: initialData?.price || 0,
          currency: 'USD',
          isActive: true
        }]
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

    setUploading('thumbnail');
    setError(null);

    try {
      const { data, error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(`hero-${slotOrder}-${file.name}`, file, { 
          upsert: true,
          cacheControl: '3600'
        });

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
      setUploading(null);
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

    setUploading('video');
    setError(null);

    try {
      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(`hero-${slotOrder}-${file.name}`, file, { 
          upsert: true,
          cacheControl: '3600'
        });

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
      setUploading(null);
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

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handlePricingChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      pricing: prev.pricing?.map((price, i) => 
        i === index ? { ...price, [field]: value } : price
      )
    }));
  };

  const addPricingOption = () => {
    setFormData(prev => ({
      ...prev,
      pricing: [...(prev.pricing || []), {
        type: 'one_time',
        price: 0,
        currency: 'USD',
        isActive: true
      }]
    }));
  };

  const removePricingOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pricing: prev.pricing?.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{initialData ? 'Edit Video' : 'Add New Video'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              disabled={uploading !== null || saving}
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Description</label>
            <textarea 
              className="w-full border rounded px-3 py-2" 
              value={formData.description} 
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} 
              required 
              disabled={uploading !== null || saving}
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Price (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input 
                type="number"
                min="0"
                step="0.01"
                className="w-full border rounded pl-7 pr-3 py-2" 
                value={formData.price || ''} 
                onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} 
                disabled={uploading !== null || saving}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Status</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.status}
              onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as HeroVideo['status'] }))}
              disabled={uploading !== null || saving}
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {formData.status === 'rejected' && (
            <div className="mb-4">
              <label className="block font-semibold mb-1">Rejection Reason</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                value={formData.rejectionReason}
                onChange={e => setFormData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                disabled={uploading !== null || saving}
                placeholder="Explain why the video was rejected..."
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block font-semibold mb-1">Age Rating</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.ageRating}
              onChange={e => setFormData(prev => ({ ...prev, ageRating: e.target.value as HeroVideo['ageRating'] }))}
              disabled={uploading !== null || saving}
            >
              <option value="G">G - General Audience</option>
              <option value="PG">PG - Parental Guidance</option>
              <option value="PG-13">PG-13 - Parental Guidance 13+</option>
              <option value="R">R - Restricted</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Category</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={formData.category}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              disabled={uploading !== null || saving}
            >
              <option value="education">Education</option>
              <option value="entertainment">Entertainment</option>
              <option value="sports">Sports</option>
              <option value="music">Music</option>
              <option value="gaming">Gaming</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                className="flex-1 border rounded px-3 py-2"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                disabled={uploading !== null || saving}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                disabled={uploading !== null || saving}
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={uploading !== null || saving}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Thumbnail</label>
            <input 
              type="file" 
              accept="image/*" 
              ref={thumbnailInput} 
              onChange={handleThumbnailUpload} 
              className="mb-2"
              disabled={uploading !== null || saving}
            />
            {uploading === 'thumbnail' && (
              <div className="mb-2 text-sm text-gray-600">
                <span className="animate-spin mr-2">⟳</span>
                Uploading thumbnail...
              </div>
            )}
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
              disabled={uploading !== null || saving}
            />
            {uploading === 'video' && (
              <div className="mb-2 text-sm text-gray-600">
                <span className="animate-spin mr-2">⟳</span>
                Uploading video...
              </div>
            )}
            {formData.videoUrl && (
              <video 
                src={formData.videoUrl} 
                controls 
                className="w-32 h-20 rounded"
              />
            )}
          </div>

          {/* Pricing Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Pricing Options</h3>
            <div className="space-y-4">
              {formData.pricing?.map((price, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      value={price.type}
                      onChange={(e) => handlePricingChange(index, 'type', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="one_time">One-time Purchase</option>
                      <option value="subscription">Subscription</option>
                      <option value="rental">Rental</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Price</label>
                    <input
                      type="number"
                      value={price.price}
                      onChange={(e) => handlePricingChange(index, 'price', parseFloat(e.target.value))}
                      className="w-full p-2 border rounded"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Currency</label>
                    <select
                      value={price.currency}
                      onChange={(e) => handlePricingChange(index, 'currency', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  {price.type !== 'one_time' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Duration (days)</label>
                      <input
                        type="number"
                        value={price.duration || ''}
                        onChange={(e) => handlePricingChange(index, 'duration', parseInt(e.target.value))}
                        className="w-full p-2 border rounded"
                        min="1"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount (%)</label>
                    <input
                      type="number"
                      value={price.discount || ''}
                      onChange={(e) => handlePricingChange(index, 'discount', parseFloat(e.target.value))}
                      className="w-full p-2 border rounded"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Promo Code</label>
                    <input
                      type="text"
                      value={price.promoCode || ''}
                      onChange={(e) => handlePricingChange(index, 'promoCode', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Region</label>
                    <input
                      type="text"
                      value={price.region || ''}
                      onChange={(e) => handlePricingChange(index, 'region', e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="Leave empty for global"
                    />
                  </div>
                  <div className="col-span-full flex justify-end">
                    <button
                      type="button"
                      onClick={() => removePricingOption(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove Pricing Option
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addPricingOption}
                className="text-blue-600 hover:text-blue-800"
              >
                + Add Pricing Option
              </button>
            </div>
          </div>

          {/* Analytics Section (Read-only) */}
          {initialData?.analytics && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Views</div>
                  <div className="text-2xl font-bold">{initialData.analytics.views.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Unique Views</div>
                  <div className="text-2xl font-bold">{initialData.analytics.uniqueViews.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Watch Time</div>
                  <div className="text-2xl font-bold">{formatWatchTime(initialData.analytics.watchTime)}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Revenue</div>
                  <div className="text-2xl font-bold">${initialData.analytics.revenue.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={uploading !== null || saving}
            >
              {saving ? 'Saving...' : 'Save Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 