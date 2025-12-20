"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getCollections, uploadFile, supabase, createCollection, getAlbums, createAlbum } from '@/lib/supabase';
import { Upload, Trash2, Edit, Image as ImageIcon, Video, Plus, AlertCircle, FolderPlus } from 'lucide-react';

interface Collection {
  id: string;
  title: string;
  description: string;
  price: number;
  video_duration: number; // actual video length
  video_path: string;
  thumbnail_path?: string;
  stripe_price_id?: string;
  videos?: any[];
  photo_paths: string[];
  created_at: string;
  updated_at: string;
  media_filename?: string; // Added for new logic
  album_id?: string | null;
  albums?: { id: string; name: string; slug: string } | null;
}

interface ExtractionResult {
  id: string;
  title: string;
  success: boolean;
  error?: string;
  estimatedDuration?: number;
}

interface Album {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  created_at: string;
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
  const [videoDuration, setVideoDuration] = useState<number>(300); // 5 minutes default video length
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [creatingAlbum, setCreatingAlbum] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [extractingDurations, setExtractingDurations] = useState(false);
  const [extractionResults, setExtractionResults] = useState<any>(null);

  useEffect(() => {
    loadCollections();
    loadAlbums();
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

  const loadAlbums = async () => {
    try {
      const { data, error } = await getAlbums();
      if (!error && data) {
        setAlbums(data);
      }
    } catch (err) {
      console.error('Failed to load albums:', err);
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
      
      // Extract video duration
      extractVideoDuration(file);
    }
  };

  const extractVideoDuration = (file: File) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration);
      setVideoDuration(duration);
      console.log(`Video duration extracted: ${duration} seconds (${Math.floor(duration / 60)} minutes)`);
    };
    
    video.onerror = () => {
      console.warn('Could not extract video duration, using default');
      setVideoDuration(300); // Default to 5 minutes
    };
    
    video.src = URL.createObjectURL(file);
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
      const { data: thumbnailUpload, error: thumbnailError } = await uploadFile(
        thumbnailFile!,
        'media',
        thumbnailFilename
      );

      if (thumbnailError) {
        throw new Error(`Thumbnail upload failed: ${thumbnailError.message}`);
      }

      setUploadProgress(50);

      // Upload photos (optional)
      const photoPaths: string[] = [];
      if (photoFiles) {
        for (let i = 0; i < photoFiles.length; i++) {
          const file = photoFiles[i];
          const photoFilename = `collections/${collectionSlug}_${timestamp}/photo_${i}.${file.name.split('.').pop()}`;
          const { data: photoUpload, error: photoError } = await uploadFile(
            file,
            'media',
            photoFilename
          );

          if (photoError) {
            throw new Error(`Photo upload failed: ${photoError.message}`);
          }

          photoPaths.push(photoFilename);
        }
      }

      setUploadProgress(70);

      // Create collection record with extracted video duration
      const collectionData = {
        title: title.trim(),
        description: description.trim(),
        price: Math.round(parseFloat(price.toString()) * 100), // Convert to cents
        video_duration: videoDuration, // actual video length (extracted from file)
        video_path: videoFilename,
        thumbnail_path: thumbnailFilename,
        photo_paths: photoPaths,
        album_id: selectedAlbumId,
      };

      const { data: createData, error: createError } = await createCollection(collectionData);
      if (createError) {
        throw new Error(`Collection creation failed: ${createError.message}`);
      }

      setUploadProgress(100);

      // Reset form
      setTitle('');
      setDescription('');
      setPrice(29.99);
      setVideoDuration(300);
      setVideoFile(null);
      setThumbnailFile(null);
      setPhotoFiles(null);
      setSelectedAlbumId(null);
      setValidationErrors([]);

      // Reload collections
      await loadCollections();

      alert('Collection created successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const handleExtractVideoDurations = async () => {
    setExtractingDurations(true);
    try {
      // First, get all collections to re-extract durations for accuracy
      const { data: collections, error: fetchError } = await supabase
        .from('collections')
        .select('id, title, video_path, video_duration, media_filename');

      if (fetchError) {
        alert(`Failed to fetch collections: ${fetchError.message}`);
        return;
      }

      if (!collections || collections.length === 0) {
        alert('No collections found to process');
        return;
      }

      alert(`Found ${collections.length} collections. Starting video duration extraction...`);

      const results: ExtractionResult[] = [];
      
      for (const collection of collections) {
        try {
          // ✅ Use media_filename if available, otherwise fall back to video_path
          const videoPath = collection.media_filename || collection.video_path;
          
          if (!videoPath) {
            results.push({
              id: collection.id,
              title: collection.title,
              success: false,
              error: 'No video path found'
            });
            continue;
          }

          // Get signed URL for the video
          const { data: signedUrlData, error: urlError } = await supabase.storage
            .from('media')
            .createSignedUrl(videoPath, 60);

          if (urlError || !signedUrlData?.signedUrl) {
            results.push({
              id: collection.id,
              title: collection.title,
              success: false,
              error: 'Could not get video URL'
            });
            continue;
          }

          // Extract duration using client-side video element
          const duration = await extractDurationFromVideo(signedUrlData.signedUrl);
          
          if (duration > 0) {
            // Update the collection with the extracted duration
            const { error: updateError } = await supabase
              .from('collections')
              .update({ video_duration: duration })
              .eq('id', collection.id);

            if (updateError) {
              results.push({
                id: collection.id,
                title: collection.title,
                success: false,
                error: updateError.message
              });
            } else {
              results.push({
                id: collection.id,
                title: collection.title,
                success: true,
                estimatedDuration: duration
              });
            }
          } else {
            results.push({
              id: collection.id,
              title: collection.title,
              success: false,
              error: 'Could not extract video duration'
            });
          }

        } catch (error) {
          results.push({
            id: collection.id,
            title: collection.title,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successful = results.filter(r => r.success).length;
      setExtractionResults({
        results,
        totalProcessed: collections.length,
        successful
      });

      alert(`Video duration extraction completed! Processed ${collections.length} collections, ${successful} successful.`);
      
      // Reload collections to show updated durations
      await loadCollections();

    } catch (error) {
      console.error('Extraction error:', error);
      alert('Failed to extract video durations');
    } finally {
      setExtractingDurations(false);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return;
    setCreatingAlbum(true);
    try {
      const slug = newAlbumName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await createAlbum({
        name: newAlbumName.trim(),
        slug,
        description: newAlbumDescription.trim() || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data[0]) {
        setAlbums((prev) => [data[0], ...prev]);
        setSelectedAlbumId(data[0].id);
        setNewAlbumName('');
        setNewAlbumDescription('');
      }
    } catch (err) {
      console.error('Failed to create album', err);
      alert('Unable to create album. Please try again.');
    } finally {
      setCreatingAlbum(false);
    }
  };

  const extractDurationFromVideo = (videoUrl: string): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const duration = Math.round(video.duration);
        console.log(`Extracted duration: ${duration} seconds (${Math.floor(duration / 60)} minutes)`);
        resolve(duration);
      };
      
      video.onerror = () => {
        console.warn('Could not extract video duration');
        resolve(0);
      };
      
      video.src = videoUrl;
    });
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-1 mb-2">Manage Collections</h1>
            <p className="text-sage">Upload and manage exclusive content collections</p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleExtractVideoDurations}
              disabled={extractingDurations}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              {extractingDurations ? (
                <>
                  <div className="w-4 h-4 spinner"></div>
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>Extract Video Durations</span>
                </>
              )}
            </button>
            
            <Link
              href="/admin/albums"
              className="btn-secondary flex items-center space-x-2"
            >
              <Video className="w-4 h-4" />
              <span>Manage Albums</span>
            </Link>
          </div>
        </div>

        {/* Extraction Results */}
        {extractionResults && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">Video Duration Extraction Results</h3>
            <p className="text-blue-700 mb-2">
              Processed {extractionResults.totalProcessed} collections, {extractionResults.successful} successful
            </p>
            {extractionResults.results && extractionResults.results.length > 0 && (
              <div className="max-h-40 overflow-y-auto">
                {extractionResults.results.map((result: ExtractionResult, index: number) => (
                  <div key={index} className="text-sm text-blue-700">
                    <span className="font-medium">{result.title}:</span> {result.success ? 
                      `Updated to ${Math.floor((result.estimatedDuration || 0) / 60)} minutes` : 
                      `Failed - ${result.error}`
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                Album (optional)
              </label>
              <select
                value={selectedAlbumId || ''}
                onChange={(e) => setSelectedAlbumId(e.target.value || null)}
                className="input"
                disabled={uploading}
              >
                <option value="">No album</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-sage mt-1">Organize collections into albums for the public site.</p>
            </div>

            <div>
              <label className="block text-earth text-sm font-medium mb-2">
                Quick Create Album
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="Album name (e.g., Europe Tour)"
                  className="input"
                  disabled={creatingAlbum || uploading}
                />
                <textarea
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                  placeholder="Album description (optional)"
                  className="input h-20 resize-none"
                  disabled={creatingAlbum || uploading}
                />
                <button
                  type="button"
                  onClick={handleCreateAlbum}
                  disabled={creatingAlbum || !newAlbumName.trim()}
                  className="btn-secondary flex items-center justify-center space-x-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingAlbum ? (
                    <>
                      <div className="w-4 h-4 spinner" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4" />
                      <span>Create & Select Album</span>
                    </>
                  )}
                </button>
              </div>
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
                      {collection.albums && (
                        <div className="inline-flex items-center px-3 py-1 bg-blanket/60 text-earth text-xs font-medium rounded-full mb-2">
                          Album: {collection.albums.name}
                        </div>
                      )}
                      
                      <p className="text-sage mb-3 line-clamp-2">
                        {collection.description}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-sage">
                        <div className="flex items-center">
                          <span className="font-medium text-earth">${(collection.price / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center">
                          <span>Permanent Access</span>
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
                      <Link
                        href={`/admin/collections/${collection.id}/edit`}
                        className="p-2 text-sage hover:text-khaki transition-colors hover:bg-blanket/50 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
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
            <li>• <strong>Price:</strong> Must be greater than 0</li>
            <li>• All files are stored securely with permanent access</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 