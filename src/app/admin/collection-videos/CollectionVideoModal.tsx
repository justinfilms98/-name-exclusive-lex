"use client";
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';

const formSchema = z.object({
  collectionId: z.string().min(1, 'Please select a collection.'),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  videoFile: z.any().refine(file => file?.[0] instanceof File, 'A video file is required.'),
  thumbnailFile: z.any().optional(),
  price: z.number().min(0, 'Price must be a positive number.').optional(),
  durationSeconds: z.number().min(1, 'Duration must be at least 1 second.').optional(),
  seoTags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type Collection = { id: string; title: string; };

interface CollectionVideoModalProps {
  open: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function CollectionVideoModal({ open, onClose, onSaveSuccess }: CollectionVideoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  
  const { register, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  const thumbnailFile = watch('thumbnailFile');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await fetch('/api/collections');
        const data = await response.json();
        if (response.ok) {
          setCollections(data || []);
        } else {
          setError(data.error || 'Failed to fetch collections');
        }
      } catch (err) {
        setError('Failed to fetch collections.');
      }
    }
    if (open) {
      fetchCollections();
    }
  }, [open]);

  useEffect(() => {
    if (thumbnailFile && thumbnailFile[0] instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(thumbnailFile[0]);
    } else {
      setThumbnailPreview(null);
    }
  }, [thumbnailFile]);
  
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData();
    // Use a helper function to append data to FormData
    const appendField = (key: keyof FormValues, value: any) => {
        if (value) {
            if (key === 'videoFile' || key === 'thumbnailFile') {
                if (value[0]) formData.append(key, value[0]);
            } else {
                formData.append(key, String(value));
            }
        }
    };

    Object.entries(data).forEach(([key, value]) => {
        appendField(key as keyof FormValues, value);
    });
    
    try {
      const response = await fetch('/api/admin/collection-videos', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save collection video.');
      }
      
      onSaveSuccess();
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 pt-20">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif text-stone-800">Add Collection Media</h2>
            <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-800">
              <X size={24} />
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

          <div className="space-y-4">
            <div>
              <label htmlFor="collectionId" className="block text-sm font-medium text-stone-700">Collection*</label>
              <select {...register("collectionId")} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                <option value="">Select a collection...</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              {errors.collectionId && <p className="mt-2 text-sm text-red-600">{errors.collectionId.message}</p>}
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title*</label>
              <input type="text" {...register("title")} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
              {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description*</label>
              <textarea {...register("description")} rows={3} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"></textarea>
              {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (USD)</label>
                <input type="number" {...register("price", { valueAsNumber: true })} step="0.01" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                {errors.price && <p className="mt-2 text-sm text-red-600">{errors.price.message}</p>}
              </div>
              <div>
                <label htmlFor="durationSeconds" className="block text-sm font-medium text-gray-700">Duration (seconds)</label>
                <input type="number" {...register("durationSeconds", { valueAsNumber: true })} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                {errors.durationSeconds && <p className="mt-2 text-sm text-red-600">{errors.durationSeconds.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="seoTags" className="block text-sm font-medium text-gray-700">SEO Tags (comma-separated)</label>
              <input type="text" {...register("seoTags")} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
              {errors.seoTags && <p className="mt-2 text-sm text-red-600">{errors.seoTags.message}</p>}
            </div>

            <div>
              <label htmlFor="videoFile" className="block text-sm font-medium text-gray-700">Video File*</label>
              <input type="file" {...register("videoFile")} accept="video/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              {errors.videoFile && <p className="mt-2 text-sm text-red-600">{errors.videoFile.message as string}</p>}
            </div>

            <div>
              <label htmlFor="thumbnailFile" className="block text-sm font-medium text-gray-700">Thumbnail (Optional)</label>
              <input type="file" {...register("thumbnailFile")} accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!isValid || isSubmitting} className="px-6 py-2 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors">
              {isSubmitting ? 'Saving...' : 'Save Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 