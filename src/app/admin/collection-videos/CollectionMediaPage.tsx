import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { MediaItemCard } from '@/components/MediaItemCard';
import { uploadCollectionMedia, deleteCollectionMedia, type UploadProgress, type UploadResult } from '@/lib/services/collectionUploadService';

interface MediaItem {
  id: string;
  mediaType: 'video' | 'photo';
  filePath: string;
  thumbnailPath?: string;
  description?: string;
  price: number;
  duration?: number;
  createdAt: string;
  collection: {
    name: string;
  };
}

interface Collection {
  id: string;
  name: string;
}

export default function CollectionMediaPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ progress: 0, status: 'complete' });
  const { addToast } = useToast();

  // Form state for upload
  const [uploadForm, setUploadForm] = useState({
    mediaType: 'video' as 'video' | 'photo',
    description: '',
    price: 0,
    duration: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      fetchMediaItems(selectedCollection);
    }
  }, [selectedCollection]);

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();
      
      if (response.ok) {
        setCollections(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedCollection(data.data[0].id);
        }
      } else {
        addToast(data.error || 'Failed to fetch collections', 'error');
      }
    } catch (error) {
      addToast('Failed to fetch collections', 'error');
    }
  };

  const fetchMediaItems = async (collectionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}/items`);
      const data = await response.json();
      
      if (response.ok) {
        setMediaItems(data.data || []);
      } else {
        addToast(data.error || 'Failed to fetch media items', 'error');
      }
    } catch (error) {
      addToast('Failed to fetch media items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !selectedCollection) {
      addToast('Please select a file and collection', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress({ progress: 0, status: 'uploading' });
    
    try {
      // Step 1: Upload main file to Supabase storage
      const fileResult = await uploadCollectionMedia(
        selectedFile,
        uploadForm.mediaType,
        selectedCollection,
        (progress) => setUploadProgress(progress)
      );

      // Step 2: Upload thumbnail if provided
      let thumbnailResult: UploadResult | null = null;
      if (selectedThumbnail) {
        thumbnailResult = await uploadCollectionMedia(
          selectedThumbnail,
          'photo',
          selectedCollection,
          (progress) => setUploadProgress({ ...progress, progress: 50 + progress.progress * 0.5 })
        );
      }

      // Step 3: Create database record with metadata only
      const response = await fetch(`/api/collections/${selectedCollection}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaType: uploadForm.mediaType,
          filePath: fileResult.path,
          thumbnailPath: thumbnailResult?.path,
          description: uploadForm.description,
          price: uploadForm.price,
          duration: uploadForm.duration ? parseInt(uploadForm.duration) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast('✅ Media uploaded successfully', 'success');
        setMediaItems(prev => [data.data, ...prev]);
        setShowUploadModal(false);
        resetUploadForm();
        setUploadProgress({ progress: 100, status: 'complete' });
      } else {
        addToast(`❌ Failed to create record: ${data.error}`, 'error');
        // Clean up uploaded files if database record creation failed
        try {
          await deleteCollectionMedia(fileResult.path);
          if (thumbnailResult) {
            await deleteCollectionMedia(thumbnailResult.path);
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded files:', cleanupError);
        }
      }
    } catch (error) {
      addToast(`❌ Failed to upload: ${error instanceof Error ? error.message : 'Network error'}`, 'error');
      setUploadProgress({ progress: 0, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      mediaType: 'video',
      description: '',
      price: 0,
      duration: '',
    });
    setSelectedFile(null);
    setSelectedThumbnail(null);
  };

  const handleEdit = (item: MediaItem) => {
    // TODO: Implement edit functionality
    addToast('Edit functionality coming soon', 'info');
  };

  const handleDelete = (id: string) => {
    // This will be handled by the MediaItemCard component
  };

  const handleDeleteSuccess = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'thumbnail') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (type === 'file') {
        setSelectedFile(files[0]);
      } else {
        setSelectedThumbnail(files[0]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-mist py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-serif text-brand-pine">Manage Collection Media</h2>
          <button 
            className="bg-brand-tan text-white px-4 py-2 rounded hover:bg-brand-earth transition"
            onClick={() => setShowUploadModal(true)}
          >
            Upload Media
          </button>
        </div>

        {/* Collection Selector */}
        <div className="mb-6">
          <label className="block text-brand-pine font-serif mb-2">Select Collection:</label>
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="border border-brand-sage rounded px-3 py-2 bg-white"
          >
            <option value="">Select a collection...</option>
            {collections.map(collection => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>

        {/* Media Items Grid */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-brand-sage">Loading media items...</p>
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-brand-mist rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-brand-sage">📁</span>
            </div>
            <p className="text-brand-sage text-lg mb-4">No media items in this collection</p>
            <button 
              className="bg-brand-pine text-white px-4 py-2 rounded hover:bg-brand-earth transition"
              onClick={() => setShowUploadModal(true)}
            >
              Upload Your First Media
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mediaItems.map((item) => (
              <MediaItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDeleteSuccess={handleDeleteSuccess}
              />
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
              <h3 className="text-xl font-bold mb-6">Upload Media</h3>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-brand-pine font-serif mb-1">Media Type</label>
                  <select
                    value={uploadForm.mediaType}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, mediaType: e.target.value as 'video' | 'photo' }))}
                    className="w-full border border-brand-sage rounded px-3 py-2"
                    required
                  >
                    <option value="video">Video</option>
                    <option value="photo">Photo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-brand-pine font-serif mb-1">File</label>
                  <input
                    type="file"
                    accept={uploadForm.mediaType === 'video' ? 'video/*' : 'image/*'}
                    onChange={(e) => handleFileChange(e, 'file')}
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-brand-pine font-serif mb-1">Thumbnail (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'thumbnail')}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-brand-pine font-serif mb-1">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-brand-sage rounded px-3 py-2"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-brand-pine font-serif mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={uploadForm.price}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-brand-sage rounded px-3 py-2"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {uploadForm.mediaType === 'video' && (
                  <div>
                    <label className="block text-brand-pine font-serif mb-1">Duration (seconds)</label>
                    <input
                      type="number"
                      value={uploadForm.duration}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full border border-brand-sage rounded px-3 py-2"
                      min="1"
                    />
                  </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <div className="pt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-brand-pine">
                        {uploadProgress.status === 'uploading' ? 'Uploading...' : 
                         uploadProgress.status === 'complete' ? 'Complete!' : 
                         uploadProgress.status === 'error' ? 'Error' : 'Processing...'}
                      </span>
                      <span className="text-brand-sage">{Math.round(uploadProgress.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          uploadProgress.status === 'error' ? 'bg-red-500' : 'bg-brand-tan'
                        }`}
                        style={{ width: `${uploadProgress.progress}%` }}
                      />
                    </div>
                    {uploadProgress.error && (
                      <p className="text-red-500 text-sm mt-1">{uploadProgress.error}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="bg-brand-tan text-white px-4 py-2 rounded hover:bg-brand-earth transition flex-1"
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition flex-1"
                    onClick={() => {
                      setShowUploadModal(false);
                      resetUploadForm();
                    }}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 