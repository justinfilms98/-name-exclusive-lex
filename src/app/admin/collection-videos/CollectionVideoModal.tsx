import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CollectionVideoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  slotOrder: number;
}

export default function CollectionVideoModal({ open, onClose, onSave, initialData, slotOrder }: CollectionVideoModalProps) {
  const [collection, setCollection] = useState(initialData?.collection || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [thumbnail, setThumbnail] = useState<string>(initialData?.thumbnail || '');
  const [videoUrl, setVideoUrl] = useState<string>(initialData?.videoUrl || '');
  const [uploading, setUploading] = useState(false);
  const thumbnailInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { data, error } = await supabase.storage.from('thumbnails').upload(`collection-${slotOrder}-${file.name}`, file, { upsert: true });
    if (data) {
      const url = supabase.storage.from('thumbnails').getPublicUrl(data.path).data.publicUrl;
      setThumbnail(url);
    }
    setUploading(false);
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { data, error } = await supabase.storage.from('videos').upload(`collection-${slotOrder}-${file.name}`, file, { upsert: true });
    if (data) {
      const url = supabase.storage.from('videos').getPublicUrl(data.path).data.publicUrl;
      setVideoUrl(url);
    }
    setUploading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      collection,
      title,
      description,
      thumbnail,
      videoUrl,
      order: slotOrder,
    });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg relative">
        <button type="button" onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black">&times;</button>
        <h3 className="text-xl font-bold mb-4">{initialData ? 'Edit' : 'Add'} Collection Video</h3>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Collection Name</label>
          <input className="w-full border rounded px-3 py-2" value={collection} onChange={e => setCollection(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Title</label>
          <input className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Description</label>
          <textarea className="w-full border rounded px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Thumbnail</label>
          <input type="file" accept="image/*" ref={thumbnailInput} onChange={handleThumbnailUpload} className="mb-2" />
          {thumbnail && <img src={thumbnail} alt="Thumbnail" className="w-32 h-20 object-cover rounded" />}
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Video File</label>
          <input type="file" accept="video/*" ref={videoInput} onChange={handleVideoUpload} className="mb-2" />
          {videoUrl && <video src={videoUrl} controls className="w-32 h-20 rounded" />}
        </div>
        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={uploading}>{uploading ? 'Uploading...' : 'Save'}</button>
      </form>
    </div>
  );
} 