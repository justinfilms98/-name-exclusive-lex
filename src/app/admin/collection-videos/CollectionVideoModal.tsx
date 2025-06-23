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
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0, 'Price must be a positive number.')
  ),
  duration: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().min(1, 'Duration must be at least 1 second.')
  ),
  seoTags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type Collection = { id: string; name: string; };

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
          setCollections(data.data || []);
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
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'videoFile' || key === 'thumbnailFile') {
        if (value?.[0]) formData.append(key, value[0]);
      } else {
        formData.append(key, String(value));
      }
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 py-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif text-stone-800">Add Collection Video</h2>
            <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-800">
              <X size={24} />
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

          <div className="space-y-6">
            {/* All form fields go here, using register from react-hook-form */}
            <div>
              <label htmlFor="collectionId" className="block text-sm font-medium text-stone-700 mb-1">Collection*</label>
              <select {...register("collectionId")} className="form-input">
                <option value="">Select a collection...</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.collectionId && <p className="form-error">{errors.collectionId.message}</p>}
            </div>

            {/* Title, Description, Files, Price, Duration, SEO Tags etc. */}
          </div>

          <div className="mt-8 flex justify-end gap-6">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors">Cancel</button>
            <button type="submit" disabled={!isValid || isSubmitting} className="px-6 py-2 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors">
              {isSubmitting ? 'Saving...' : 'Save Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 