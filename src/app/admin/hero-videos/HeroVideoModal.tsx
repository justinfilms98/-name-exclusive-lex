"use client";
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';

// Define the form schema for validation
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  videoFile: z.any().refine(file => file?.[0] instanceof File, 'A video file is required.'),
  thumbnailFile: z.any().optional(),
  price: z.number().optional(),
  duration: z.number().optional(),
  category: z.string().optional(),
  seoTags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface HeroVideoModalProps {
  open: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  slotOrder: number;
}

export default function HeroVideoModal({ open, onClose, onSaveSuccess, slotOrder }: HeroVideoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  const thumbnailFile = watch('thumbnailFile');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      reset({ title: '', description: '' });
    }
  }, [open, reset]);

  useEffect(() => {
    if (thumbnailFile && thumbnailFile[0] instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(thumbnailFile[0]);
    } else {
      setThumbnailPreview(null);
    }
  }, [thumbnailFile]);

  if (!open) return null;

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('order', String(slotOrder));
    formData.append('videoFile', data.videoFile[0]);
    if (data.thumbnailFile?.[0]) {
      formData.append('thumbnailFile', data.thumbnailFile[0]);
    }
    if (data.price) {
      formData.append('price', String(data.price));
    }
    if (data.duration) {
      formData.append('duration', String(data.duration));
    }
    if (data.category) {
      formData.append('category', data.category);
    }
    if (data.seoTags) {
      formData.append('seoTags', data.seoTags);
    }

    try {
      const response = await fetch('/api/admin/hero-videos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save hero video.');
      }
      
      onSaveSuccess();
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 pt-20">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-full overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif text-stone-800">Add Hero Video</h2>
            <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-800">
              <X size={24} />
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" {...register("title")} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea {...register("description")} rows={3} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"></textarea>
                {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>}
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (USD, optional)</label>
                <input type="number" {...register("price")} step="0.01" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                {errors.price && <p className="mt-2 text-sm text-red-600">{errors.price.message}</p>}
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (seconds, optional)</label>
                <input type="number" {...register("duration")} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                {errors.duration && <p className="mt-2 text-sm text-red-600">{errors.duration.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category (optional)</label>
                <input type="text" {...register("category")} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                {errors.category && <p className="mt-2 text-sm text-red-600">{errors.category.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="seoTags" className="block text-sm font-medium text-gray-700">SEO Tags (comma-separated, optional)</label>
                <input type="text" {...register("seoTags")} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                {errors.seoTags && <p className="mt-2 text-sm text-red-600">{errors.seoTags.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="videoFile" className="block text-sm font-medium text-gray-700">Video File</label>
                <input type="file" {...register("videoFile")} accept="video/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                {errors.videoFile && <p className="mt-2 text-sm text-red-600">{errors.videoFile.message as string}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="thumbnailFile" className="block text-sm font-medium text-gray-700">Thumbnail (Optional)</label>
                <input type="file" {...register("thumbnailFile")} accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              </div>

              {/* Thumbnail Preview */}
              {thumbnailPreview && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Thumbnail Preview</label>
                  <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-48 aspect-video object-cover rounded-md border" />
                </div>
              )}
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