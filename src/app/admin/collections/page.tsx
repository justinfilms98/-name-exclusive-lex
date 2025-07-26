"use client";

import { useState, useEffect } from 'react';
import { getCollections, uploadFile, supabase } from '@/lib/supabase';
import { Upload, Trash2, Edit, Save, X, Image as ImageIcon, Video, Plus, AlertCircle } from 'lucide-react';

interface Collection {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // access duration
  video_duration: number; // actual video length
  video_path: string;
  thumbnail_path?: string;
  stripe_price_id?: string;
  videos?: any[];
  photo_paths: string[];
  created_at: string;
  updated_at: string;
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(29.99);
  const [duration, setDuration] = useState<number>(1800); // 30 minutes default access time
  const [videoDuration, setVideoDuration] = useState<number>(300); // 5 minutes default video length
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const { data, error } = await getCollections();
      if (!error && data) {
        setCollections(data);
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push('Title is required');
    }

    if (!description.trim()) {
      errors.push('Description is required');
    }

    if (price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (duration <= 0) {
      errors.push('Access duration must be greater than 0');
    }

    if (videoDuration <= 0) {
      errors.push('Video duration must be greater than 0');
    }

    if (!videoFile) {
      errors.push('Video file is required');
    }

    if (!thumbnailFile) {
      errors.push('Thumbnail image is required');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file (MP4, WebM, MOV, etc.)');
        return;
      }
      
      // Validate file size (max 2GB)
      if (file.size > 2 * 1024 * 1024 * 1024) {
        alert('Video file must be less than 2GB');
        return;
      }
      
      setVideoFile(file);
      setValidationErrors(prev => prev.filter(error => !error.includes('Video')));
    }
  };

  const handleThumbnailFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, WebP, etc.)');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        alert('Thumbnail must be less than 10MB');
        return;
      }
      
      setThumbnailFile(file);
      setValidationErrors(prev => prev.filter(error => !error.includes('Thumbnail')));
    }
  };

  const handlePhotoFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Validate all files are images
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (!file.type.startsWith('image/')) {
          alert('All photo files must be images');
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert('Each photo must be less than 10MB');
          return;
        }
      }
      
      setPhotoFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (!validateForm()) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const collectionSlug = title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      
      // Upload video (required)
      const videoFilename = `collections/${collectionSlug}_${timestamp}/video.${videoFile!.name.split('.').pop()}`;
      const { data: videoUpload, error: videoError } = await uploadFile(
        videoFile!,
        'media',
        videoFilename
      );

      if (videoError) {
        throw new Error(`Video upload failed: ${videoError.message}`);
      }

      setUploadProgress(30);

      // Upload thumbnail (required)
      const thumbnailFilename = `collections/${collectionSlug}_${timestamp}/thumbnail.${thumbnailFile!.name.split('.').pop()}`;
      const { data: thumbUpload, error: thumbError } = await uploadFile(
        thumbnailFile!,
        'media',
        thumbnailFilename
      );

      if (thumbError) {
        throw new Error(`Thumbnail upload failed: ${thumbError.message}`);
      }

      setUploadProgress(60);

      // Upload photos (optional)
      const photoPaths: string[] = [];
      if (photoFiles && photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          const file = photoFiles[i];
          const photoFilename = `collections/${collectionSlug}_${timestamp}/photo_${i + 1}.${file.name.split('.').pop()}`;
          
          const { data: photoUpload, error: photoError } = await uploadFile(
            file,
            'media',
            photoFilename
          );

          if (!photoError) {
            photoPaths.push(photoFilename);
          }
        }
      }

      setUploadProgress(80);

      // Insert collection record with proper price conversion to cents
      const { data, error } = await supabase
        .from('collections')
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            price: Math.round(parseFloat(price.toString()) * 100), // Convert to cents
            duration: duration, // access duration
            video_duration: videoDuration, // actual video length
            video_path: videoFilename,
            thumbnail_path: thumbnailFilename,
            stripe_price_id: null, // Will be set when Stripe price is created
            videos: [], // Initialize empty videos array
            photo_paths: photoPaths,
          }
        ])
        .select('*')
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      setUploadProgress(100);

      // Reset form
      setTitle('');
      setDescription('');
      setPrice(29.99);
      setDuration(1800);
      setVideoDuration(300);
      setVideoFile(null);
      setThumbnailFile(null);
      setPhotoFiles(null);
      setValidationErrors([]);
      
      // Clear file inputs
      const videoInput = document.getElementById('video-input') as HTMLInputElement;
      const thumbnailInput = document.getElementById('thumbnail-input') as HTMLInputElement;
      const photosInput = document.getElementById('photos-input') as HTMLInputElement;
      if (videoInput) videoInput.value = '';
      if (thumbnailInput) thumbnailInput.value = '';
      if (photosInput) photosInput.value = '';
      
      // Reload collections immediately
      await loadCollections();
      
      // Clear any cached data and trigger revalidation
      if (typeof window !== 'undefined' && window.location) {
        // Force a page refresh to clear any cached data
        window.location.reload();
      }
      
      alert('Collection uploaded successfully!');

    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (collection: Collection) => {
    if (!confirm(`Are you sure you want to delete "${collection.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('collections')
        .delete()
        .eq('id', collection.id);

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Delete files from storage
      const filesToDelete = [
        collection.video_path,
        ...(collection.thumbnail_path ? [collection.thumbnail_path] : []),
        ...collection.photo_paths
      ];

      const { error: storageError } = await supabase.storage
        .from('media')
        .remove(filesToDelete);

      if (storageError) {
        console.warn('Storage deletion warning:', storageError);
      }

      await loadCollections();
      alert('Collection deleted successfully!');

    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`Delete failed: ${error.message}`);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const formatVideoDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-almond flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spinner mx-auto mb-4"></div>
          <p className="text-sage text-lg">Loading collections management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-almond p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-1 mb-2">Manage Collections</h1>
          <p className="text-sage">Upload and manage exclusive collections with videos and photos</p>
        </div>

        {/* Upload Form */}
        <div className="card-glass p-8 mb-8">
          <h2 className="heading-3 mb-6 flex items-center">
            <Plus className="w-6 h-6 mr-2" />
            Create New Collection
          </h2>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-red-800 font-medium mb-2">Please fix the following errors:</h3>
                  <ul className="text-red-700 text-sm space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-earth text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setValidationErrors(prev => prev.filter(error => !error.includes('Title')));
                }}
                className="input"
                placeholder="Enter collection title"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-earth text-sm font-medium mb-2">
                Price (USD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => {
                  setPrice(parseFloat(e.target.value) || 0);
                  setValidationErrors(prev => prev.filter(error => !error.includes('Price')));
                }}
                className="input"
                disabled={uploading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-earth text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setValidationErrors(prev => prev.filter(error => !error.includes('Description')));
                }}
                className="input h-24 resize-none"
                placeholder="Enter collection description"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-earth text-sm font-medium mb-2">
                Access Duration (Minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={duration / 60}
                onChange={(e) => {
                  setDuration((parseInt(e.target.value) || 30) * 60);
                  setValidationErrors(prev => prev.filter(error => !error.includes('Duration')));
                }}
                className="input"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-earth text-sm font-medium mb-2">
                Video Duration (Minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={videoDuration / 60}
                onChange={(e) => {
                  setVideoDuration((parseInt(e.target.value) || 5) * 60);
                  setValidationErrors(prev => prev.filter(error => !error.includes('Video Duration')));
                }}
                className="input"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-earth text-sm font-medium mb-2">
                Video File <span className="text-red-500">* (Required - Max 2GB)</span>
              </label>
              <input
                id="video-input"
                type="file"
                accept="video/*"
                onChange={handleVideoFileSelect}
                className="input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sage file:text-blanc hover:file:bg-khaki"
                disabled={uploading}
              />
              {videoFile && (
                <p className="mt-2 text-sage text-sm">
                  ✓ Selected: {videoFile.name} ({formatFileSize(videoFile.size)})
                </p>
              )}
            </div>

            <div>
              <label className="block text-earth text-sm font-medium mb-2">
                Thumbnail Image <span className="text-red-500">* (Required - Max 10MB)</span>
              </label>
              <input
                id="thumbnail-input"
                type="file"
                accept="image/*"
                onChange={handleThumbnailFileSelect}
                className="input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sage file:text-blanc hover:file:bg-khaki"
                disabled={uploading}
              />
              {thumbnailFile && (
                <p className="mt-2 text-sage text-sm">
                  ✓ Selected: {thumbnailFile.name} ({formatFileSize(thumbnailFile.size)})
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-earth text-sm font-medium mb-2">
                Photos (Optional - Max 10MB each)
              </label>
              <input
                id="photos-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoFilesSelect}
                className="input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blanket file:text-earth hover:file:bg-mushroom"
                disabled={uploading}
              />
              {photoFiles && (
                <p className="mt-2 text-sage text-sm">
                  ✓ Selected: {photoFiles.length} photos
                </p>
              )}
            </div>
          </div>

          {uploading && uploadProgress > 0 && (
            <div className="mt-6">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sage text-sm mt-1">{uploadProgress}% uploaded</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 spinner mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Create Collection
              </>
            )}
          </button>
        </div>

        {/* Collections List */}
        <div className="card-glass p-8">
          <h2 className="heading-3 mb-6 flex items-center">
            <Video className="w-6 h-6 mr-2" />
            Existing Collections ({collections.length})
          </h2>

          {collections.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="w-16 h-16 text-sage mx-auto mb-4" />
              <p className="text-sage">No collections created yet.</p>
              <p className="text-khaki text-sm mt-2">Create your first collection above to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="card p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-serif text-earth mb-2">
                        {collection.title}
                      </h3>
                      
                      <p className="text-sage mb-3 line-clamp-2">
                        {collection.description}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-sage">
                        <div className="flex items-center">
                          <span className="font-medium text-earth">${(collection.price / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center">
                          <span>{formatDuration(collection.duration)}</span>
                        </div>
                        <div className="flex items-center">
                          <span>{formatVideoDuration(collection.video_duration)}</span>
                        </div>
                        <div className="flex items-center">
                          <span>{collection.photo_paths.length} photos</span>
                        </div>
                        <div className="flex items-center">
                          <span>{new Date(collection.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleDelete(collection)}
                        className="p-2 text-sage hover:text-khaki transition-colors hover:bg-blanket/50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Requirements Notice */}
        <div className="mt-8 bg-sage/10 border border-sage/30 rounded-lg p-6">
          <h3 className="text-sage font-serif text-lg mb-3">Upload Requirements:</h3>
          <ul className="text-earth text-sm space-y-1">
            <li>• <strong>Video file:</strong> Required - MP4/WebM formats, up to 2GB</li>
            <li>• <strong>Thumbnail:</strong> Required - JPG/PNG formats, up to 10MB</li>
            <li>• <strong>Photos:</strong> Optional - JPG/PNG formats, up to 10MB each</li>
            <li>• <strong>Title & Description:</strong> Required for all collections</li>
            <li>• <strong>Price & Duration:</strong> Must be greater than 0</li>
            <li>• All files are stored securely with time-limited access</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 