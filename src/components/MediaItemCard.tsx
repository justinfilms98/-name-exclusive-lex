import React, { useState } from 'react';
import { useToast } from './Toast';

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

interface MediaItemCardProps {
  item: MediaItem;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
  onDeleteSuccess: (id: string) => void;
}

export const MediaItemCard: React.FC<MediaItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  onDeleteSuccess
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { addToast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/media/${item.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        addToast('✅ Deleted', 'success');
        onDeleteSuccess(item.id);
      } else {
        const errorData = await response.json();
        addToast(`❌ Failed to delete: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      addToast('❌ Failed to delete: Network error', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getThumbnailUrl = () => {
    // In a real implementation, you'd get the public URL from Supabase
    // For now, we'll use a placeholder or the file path
    return item.thumbnailPath || '/placeholder-thumbnail.jpg';
  };

  return (
    <>
      <div className="bg-brand-almond rounded-lg shadow p-4 flex flex-col min-h-[300px] transition-transform hover:scale-105 hover:shadow-xl">
        <div className="relative mb-3">
          <img 
            src={getThumbnailUrl()} 
            alt={item.description || 'Media item'} 
            className="w-full h-32 object-cover rounded"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-thumbnail.jpg';
            }}
          />
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {item.mediaType.toUpperCase()}
          </div>
          {item.duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              {formatDuration(item.duration)}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-serif text-brand-pine mb-2 line-clamp-2">
            {item.description || 'Untitled'}
          </h3>
          
          <p className="text-brand-sage text-sm mb-2">
            Collection: {item.collection.name}
          </p>
          
          <p className="text-brand-tan font-bold text-lg mb-2">
            ${item.price.toFixed(2)}
          </p>
          
          <p className="text-brand-earth text-xs mb-3">
            Added: {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2 mt-auto">
          <button 
            className="bg-brand-pine text-white px-3 py-2 rounded shadow hover:bg-brand-earth focus:outline-none focus:ring-2 focus:ring-brand-tan transition flex-1"
            onClick={() => onEdit(item)}
          >
            Edit
          </button>
          <button 
            className="bg-red-600 text-white px-3 py-2 rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition flex-1"
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {item.mediaType}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition flex-1"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition flex-1"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 