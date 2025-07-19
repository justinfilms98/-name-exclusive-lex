"use client";

import { useState } from 'react';
import { uploadFile, createCollection } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

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
    duration: '1800', // 30 minutes default
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
    // Video validation (max 15 min / 2GB)
    if (files.video) {
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
      if (files.video.size > maxSize) {
        setError('Video file must be under 2GB');
        return false;
      }
    }

    if (!files.video) {
      setError('Video file is required');
      return false;
    }

    if (!files.thumbnail) {
      setError('Thumbnail image is required');
      return false;
    }

    return true;
  };

  const uploadFileWithProgress = async (file: File, bucket: string, path: string, progressKey: keyof UploadProgress) => {
    // Simulate progress for now - Supabase doesn't have built-in progress
    setProgress(prev => ({ ...prev, [progressKey]: 0 }));
    
    const { data, error } = await uploadFile(file, bucket, path);
    
    if (error) {
      throw new Error(`Failed to upload ${progressKey}: ${error.message}`);
    }
    
    setProgress(prev => ({ ...prev, [progressKey]: 100 }));
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateFiles()) return;
    
    setUploading(true);
    setError(null);
    
    try {
      // Create unique collection ID
      const collectionId = crypto.randomUUID();
      const timestamp = Date.now();
      
      // Upload video
      const videoPath = `collections/${collectionId}/video_${timestamp}.${files.video!.name.split('.').pop()}`;
      await uploadFileWithProgress(files.video!, 'media', videoPath, 'video');
      
      // Upload thumbnail
      const thumbnailPath = `collections/${collectionId}/thumbnail_${timestamp}.${files.thumbnail!.name.split('.').pop()}`;
      await uploadFileWithProgress(files.thumbnail!, 'media', thumbnailPath, 'thumbnail');
      
      // Upload photos if any
      const photoPaths: string[] = [];
      if (files.photos.length > 0) {
        for (let i = 0; i < files.photos.length; i++) {
          const photo = files.photos[i];
          const photoPath = `collections/${collectionId}/photo_${i}_${timestamp}.${photo.name.split('.').pop()}`;
          await uploadFileWithProgress(photo, 'media', photoPath, 'photos');
          photoPaths.push(photoPath);
        }
      }
      
      // Create collection record
      const collection = {
        id: collectionId,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        video_path: videoPath,
        thumbnail_path: thumbnailPath,
        photo_paths: photoPaths,
        created_at: new Date().toISOString(),
      };
      
      const { error: dbError } = await createCollection(collection);
      
      if (dbError) {
        throw new Error(`Failed to save collection: ${dbError.message}`);
      }
      
      setSuccess(true);
      
      // Reset form
      setFormData({ title: '', description: '', price: '', duration: '1800' });
      setFiles({ video: null, photos: [], thumbnail: null });
      setProgress({});
      
    } catch (err: any) {
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
      
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Access Duration (seconds)</label>
        <select
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
          className="w-full border border-stone-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-500"
        >
          <option value="900">15 minutes</option>
          <option value="1800">30 minutes</option>
          <option value="3600">1 hour</option>
          <option value="7200">2 hours</option>
        </select>
      </div>
      
      {/* File Uploads */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Video File (Max 15 min / 2GB) *
          </label>
          <input
            type="file"
            accept="video/*"
            required
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
        </div>
        
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Thumbnail Image *
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
            Additional Photos (Optional)
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