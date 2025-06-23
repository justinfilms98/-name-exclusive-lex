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

const CollectionCard = ({ collection, onClick }: { collection: Collection, onClick: () => void }) => (
  <div 
    className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between items-center text-center cursor-pointer hover:shadow-lg transition-shadow"
    onClick={onClick}
  >
    <h3 className="text-xl font-serif text-stone-800 mb-4">{collection.name}</h3>
    <button className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-emerald-700 transition-colors">
      Manage Media
    </button>
  </div>
);

export default function CollectionMediaPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/collections');
      if (!response.ok) throw new Error('Failed to fetch collections');
      const data = await response.json();
      setCollections(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleManageClick = (collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCollectionId(null);
  };

  const handleSaveSuccess = () => {
    handleModalClose();
    // Optionally, you can refresh the media items for the edited collection here
    // but since we are just uploading, closing the modal is sufficient.
  };

  const handleEdit = (item: MediaItem) => {
    // TODO: Implement edit functionality
    addToast('Edit functionality coming soon', 'info');
  };

  const handleDelete = (id: string) => {
    // This will be handled by the MediaItemCard component
  };

  const handleDeleteSuccess = (id: string) => {
    // This will be handled by the MediaItemCard component
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif text-stone-800">Manage Collections</h1>
          <p className="mt-2 text-lg text-stone-600">Select a collection to add or edit its media.</p>
        </div>

        {loading ? (
          <p className="text-center">Loading collections...</p>
        ) : collections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {collections.map(collection => (
              <CollectionCard 
                key={collection.id} 
                collection={collection} 
                onClick={() => handleManageClick(collection.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-2xl font-serif text-stone-700">No Collections Found</h3>
            <p className="text-stone-500 mt-2">Please add collections via the Supabase dashboard to begin managing media.</p>
          </div>
        )}

        <CollectionVideoModal
          open={isModalOpen}
          onClose={handleModalClose}
          onSaveSuccess={handleSaveSuccess}
        />
      </div>
    </div>
  );
} 