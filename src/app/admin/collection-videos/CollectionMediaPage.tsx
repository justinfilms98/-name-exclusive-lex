import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { MediaItemCard } from '@/components/MediaItemCard';
import CollectionVideoModal from './CollectionVideoModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

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

  const handleSaveSuccess = () => {
    addToast('✅ Media uploaded successfully', 'success');
    if (selectedCollection) {
      fetchMediaItems(selectedCollection);
    }
    setIsModalOpen(false);
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

  return (
    <div className="min-h-screen bg-brand-mist py-8 px-4 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-stone-800">Manage Collection Media</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedCollection}
            className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors font-semibold"
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
              onClick={() => setIsModalOpen(true)}
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

        <CollectionVideoModal 
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaveSuccess={handleSaveSuccess}
          collectionId={selectedCollection}
        />
      </div>
    </div>
  );
} 