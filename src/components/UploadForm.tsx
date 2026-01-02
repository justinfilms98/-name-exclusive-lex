"use client";

import { useState } from 'react';
import { uploadFile, createCollection, supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import QualityComparison from './QualityComparison';

interface UploadProgress {
  video?: number;
  photos?: number;
  thumbnail?: number;
}

export default function UploadForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
  });
  
  const [files, setFiles] = useState({
    video: null as File | null,
    photos: [] as File[],
    thumbnail: null as File | null,
  });
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateFiles = () => {
    // Thumbnail validation (max 10MB) - REQUIRED
    if (files.thumbnail) {
      const maxThumbnailSize = 10 * 1024 * 1024; // 10MB
      if (files.thumbnail.size > maxThumbnailSize) {
        setError('Thumbnail image must be under 10MB');
        return false;
      }
    }

    if (!files.thumbnail) {
      setError('Thumbnail image is required');
      return false;
    }

    // Video validation (max 50MB for Supabase free tier) - OPTIONAL
    if (files.video) {
      const maxSize = 50 * 1024 * 1024; // 50MB (Supabase free tier limit)
      if (files.video.size > maxSize) {
        setError('Video file must be under 50MB for upload. Please compress your video or use a smaller file. For larger files, consider upgrading to Supabase Pro plan.');
        return false;
      }
    }

    // Photo validation (max 10MB each)
    for (let i = 0; i < files.photos.length; i++) {
      const photo = files.photos[i];
      const maxPhotoSize = 10 * 1024 * 1024; // 10MB
      if (photo.size > maxPhotoSize) {
        setError(`Photo ${i + 1} must be under 10MB`);
        return false;
      }
    }

    // At least one of: video OR photos must exist
    if (!files.video && files.photos.length === 0) {
      setError('Either a video file or at least one photo is required');
      return false;
    }

    return true;
  };

  const uploadFileWithProgress = async (file: File, bucket: string, path: string, progressKey: keyof UploadProgress) => {
    setProgress(prev => ({ ...prev, [progressKey]: 0 }));
    
    try {
      console.log(`Starting upload for ${progressKey}:`, { file: file.name, size: file.size, bucket, path });
      
      // Supabase free tier limit is 50MB
      const SUPABASE_LIMIT = 50 * 1024 * 1024; // 50MB
      
      if (file.size > SUPABASE_LIMIT) {
        console.log(`File exceeds Supabase free tier limit (50MB): ${file.name}`);
        throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the 50MB limit for Supabase free tier. Please compress your video or upgrade to Supabase Pro plan for larger files.`);
      }
      
      // Use regular client-side upload for files under 50MB
      const { data, error } = await uploadFile(file, bucket, path);
      
      if (error) {
        console.error(`Upload error for ${progressKey}:`, error);
        throw new Error(`Failed to upload ${progressKey}: ${error.message}`);
      }
      
      console.log(`Upload successful for ${progressKey}:`, data);
      setProgress(prev => ({ ...prev, [progressKey]: 100 }));
      return data;
    } catch (err: any) {
      console.error(`Upload failed for ${progressKey}:`, err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateFiles()) return;
    
    setUploading(true);
    setError(null);
    
    try {
      console.log('Starting collection upload process...');
      
      // Create unique collection ID
      const collectionId = crypto.randomUUID();
      const timestamp = Date.now();
      
      console.log('Collection ID:', collectionId);
      console.log('Files to upload:', {
        video: files.video?.name,
        thumbnail: files.thumbnail?.name,
        photos: files.photos.map(p => p.name)
      });
      
      // Upload video (optional)
      let videoPath: string | null = null;
      if (files.video) {
        videoPath = `collections/${collectionId}/video_${timestamp}.${files.video.name.split('.').pop()}`;
        console.log('Uploading video to:', videoPath);
        await uploadFileWithProgress(files.video, 'media', videoPath, 'video');
      }
      
      // Upload thumbnail (required)
      const thumbnailPath = `collections/${collectionId}/thumbnail_${timestamp}.${files.thumbnail!.name.split('.').pop()}`;
      console.log('Uploading thumbnail to:', thumbnailPath);
      await uploadFileWithProgress(files.thumbnail!, 'media', thumbnailPath, 'thumbnail');
      
      // Upload photos if any
      const photoPaths: string[] = [];
      if (files.photos.length > 0) {
        for (let i = 0; i < files.photos.length; i++) {
          const photo = files.photos[i];
          const photoPath = `collections/${collectionId}/photo_${i}_${timestamp}.${photo.name.split('.').pop()}`;
          console.log('Uploading photo to:', photoPath);
          await uploadFileWithProgress(photo, 'media', photoPath, 'photos');
          photoPaths.push(photoPath);
        }
      }
      
      // Create collection record
      const collection: any = {
        id: collectionId,
        title: formData.title,
        description: formData.description,
        price: Math.round(parseFloat(formData.price) * 100), // Convert dollars to cents
        thumbnail_path: thumbnailPath,
        photo_paths: photoPaths,
        video_duration: 0, // Default, will be set if video exists
        created_at: new Date().toISOString(),
      };

      // Only include video fields if video was uploaded
      if (videoPath) {
        collection.video_path = videoPath;
        collection.media_filename = videoPath;
      }
      
      console.log('Creating collection record:', collection);
      const { error: dbError } = await createCollection(collection);
      
      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save collection: ${dbError.message}`);
      }
      
      // Auto-generate Stripe Price for collection
      console.log('Creating Stripe price for collection:', collectionId);
      const stripePriceRes = await fetch('/api/create-stripe-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: formData.title,
          amount: collection.price, // Already in cents
          collection_id: collectionId
        })
      });
      
      if (!stripePriceRes.ok) {
        const errorData = await stripePriceRes.json();
        console.error('Stripe price creation failed:', errorData);
        throw new Error(`Failed to create Stripe price: ${errorData.error}`);
      }
      
      const { price_id } = await stripePriceRes.json();
      console.log('Stripe price created:', price_id);
      
      // Update collection with stripe_price_id
      const { error: updateError } = await supabase
        .from('collections')
        .update({ stripe_price_id: price_id })
        .eq('id', collectionId);
      
      if (updateError) {
        console.error('Failed to update collection with stripe_price_id:', updateError);
        // Don't throw error here as the collection was created successfully
        console.warn('Collection created but stripe_price_id update failed');
      }
      
      console.log('Collection created successfully!');
      setSuccess(true);
      
      // Reset form
      setFormData({ title: '', description: '', price: '' });
      setFiles({ video: null, photos: [], thumbnail: null });
      setProgress({});
      
    } catch (err: any) {
      console.error('Upload process failed:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setUploading(false);
    setProgress({});
    setError('Upload cancelled');
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Collection Uploaded Successfully!</h3>
        <button
          onClick={() => setSuccess(false)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Upload Another Collection
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-stone-800">Upload New Collection</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          {error}
        </div>
      )}
      
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Price ($)</label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-500"
          rows={3}
        />
      </div>
      
      {/* File Uploads */}
      <div className="space-y-4">
        {/* Quality Comparison */}
        <QualityComparison />
        
        {/* File Size Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">📁 File Size Limits</h4>
          <p className="text-sm text-blue-700 mb-2">
            Due to Supabase free tier limitations, file uploads are currently limited to:
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Thumbnail images:</strong> Required - 10MB maximum</li>
            <li>• <strong>Video files:</strong> Optional - 50MB maximum</li>
            <li>• <strong>Additional photos:</strong> Required if no video - 10MB each maximum</li>
            <li>• <strong>At least one:</strong> Either a video OR at least one photo must be provided</li>
          </ul>
          <p className="text-xs text-blue-600 mt-2">
            💡 <strong>Tip:</strong> Use H.265 (HEVC) encoding for better quality at smaller file sizes. See our compression guide for detailed settings.
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Thumbnail Image (Max 10MB) <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            required
            onChange={(e) => setFiles(prev => ({ ...prev, thumbnail: e.target.files?.[0] || null }))}
            className="w-full border border-stone-300 rounded-md px-3 py-2"
          />
          {progress.thumbnail !== undefined && (
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.thumbnail}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{progress.thumbnail}% uploaded</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Video File (Optional - Max 50MB)
          </label>
          <input
            type="file"
            accept="video/*,.mp4,.mov,.avi,.mkv"
            onChange={(e) => setFiles(prev => ({ ...prev, video: e.target.files?.[0] || null }))}
            className="w-full border border-stone-300 rounded-md px-3 py-2"
          />
          {progress.video !== undefined && (
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.video}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{progress.video}% uploaded</p>
            </div>
          )}
          {!files.video && (
            <p className="mt-1 text-xs text-gray-500">Video is optional. If no video is provided, at least one photo is required.</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Photos <span className={!files.video ? "text-red-500" : "text-gray-500"}>{(files.video ? "(Optional" : "(Required if no video")} - Max 10MB each)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(prev => ({ ...prev, photos: Array.from(e.target.files || []) }))}
            className="w-full border border-stone-300 rounded-md px-3 py-2"
          />
          {progress.photos !== undefined && (
            <div className="mt-2">
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.photos}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{progress.photos}% uploaded</p>
            </div>
          )}
          {files.photos.length === 0 && !files.video && (
            <p className="mt-1 text-xs text-red-500">At least one photo is required when no video is provided.</p>
          )}
        </div>
      </div>
      
      {/* Submit/Cancel */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={uploading}
          className="bg-stone-800 text-white px-6 py-2 rounded-md hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Collection'}
        </button>
        
        {uploading && (
          <button
            type="button"
            onClick={cancelUpload}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
          >
            Cancel Upload
          </button>
        )}
      </div>
    </form>
  );
} 