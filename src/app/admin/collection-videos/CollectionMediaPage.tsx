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
  title: string;
}

const CollectionCard = ({ collection, onClick }: { collection: Collection, onClick: () => void }) => (
  <div 
    className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between items-center text-center cursor-pointer hover:shadow-lg transition-shadow"
    onClick={onClick}
  >
    <h3 className="text-xl font-serif text-stone-800 mb-4">{collection.title}</h3>
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
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/collections');
      if (!response.ok) throw new Error('Failed to fetch collections');
      const data = await response.json();
      setCollections(data || []);
    } catch (error) {
      console.error(error);
      setError('Failed to fetch collections');
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
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif text-stone-800">Manage Collection Media</h1>
          <p className="text-stone-500">Select a collection to view and manage its media.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-stone-800 text-white px-5 py-2 rounded-md font-semibold hover:bg-stone-900 transition-colors"
        >
          Upload Media
        </button>
      </div>

      {loading && <p>Loading collections...</p>}
      {error && <p className="text-red-500">{error}</p>}

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
          <p className="text-stone-500 mt-2">Please add collections via the {`'Admin' > 'Collections'`} page to begin managing media.</p>
        </div>
      )}

      <CollectionVideoModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
} 