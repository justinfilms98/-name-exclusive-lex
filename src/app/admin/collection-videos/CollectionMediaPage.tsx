"use client";
import { useState, useEffect } from 'react';
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
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    // Fetch all collections to populate dropdown
    // This part can be removed if the dropdown is removed
  }, []);

  const handleSaveSuccess = () => {
    if (selectedCollection) {
      // fetchMediaItems(selectedCollection);
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
            className="bg-emerald-600 text-white px-6 py-2 rounded-md hover:bg-emerald-700 font-semibold"
          >
            Upload Media
          </button>
        </div>

        {/* The rest of the media items display can be adjusted based on the new flow */}
        
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