"use client";
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';

// Define the form schema for validation, matching the new HeroVideo model
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  videoFile: z.any().refine(file => file?.[0] instanceof File, 'A video file is required.'),
  thumbnailFile: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// The initialData prop will be simpler as well
interface HeroVideoModalProps {
  open: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  initialData?: { id: number; title: string; description: string; } | null;
  slotOrder: number;
}

export default function HeroVideoModal({ open, onClose, onSaveSuccess, initialData, slotOrder }: HeroVideoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  const thumbnailFile = watch('thumbnailFile');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    // Reset form when modal opens or initialData changes
    if (open && initialData) {
      reset({ title: initialData.title, description: initialData.description });
    } else if (open) {
      reset({ title: '', description: '' });
    }
  }, [open, initialData, reset]);

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

  // Reusable direct-to-storage upload function
  const uploadToSupabase = async (file: File, collection: string) => {
    const signedUrlRes = await fetch('/api/admin/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileType: file.type, collection }),
    });
    const { signedUrl, path } = await signedUrlRes.json();
    if (!signedUrl) throw new Error('Could not get signed URL.');
    
    await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    return path;
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const videoFile = data.videoFile[0];
      const thumbFile = data.thumbnailFile?.[0];

      const videoPath = await uploadToSupabase(videoFile, 'hero-videos');
      let thumbnailPath: string | undefined;
      if (thumbFile) {
        thumbnailPath = await uploadToSupabase(thumbFile, 'hero-videos/thumbnails');
      }

      const response = await fetch('/api/hero-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: initialData?.id,
          title: data.title,
          description: data.description,
          videoPath,
          thumbnailPath,
          order: slotOrder,
        }),
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
            <h2 className="text-2xl font-serif text-stone-800">{initialData ? 'Edit' : 'Add'} Hero Video</h2>
            <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-800">
              <X size={24} />
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

          <div className="space-y-6">
            {/* Form Fields using the new shared classes */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1">Title</label>
              <input {...register("title")} className="form-input" />
              {errors.title && <p className="form-error">{errors.title.message}</p>}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-1">Description</label>
              <textarea {...register("description")} rows={4} className="form-textarea" />
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>
            <div>
              <label htmlFor="videoFile" className="block text-sm font-medium text-stone-700 mb-1">Main Video</label>
              <input type="file" {...register("videoFile")} accept="video/mp4" className="form-input" />
              {errors.videoFile && <p className="form-error">{errors.videoFile.message as string}</p>}
            </div>
             <div>
              <label htmlFor="thumbnailFile" className="block text-sm font-medium text-stone-700 mb-1">Thumbnail (Optional)</label>
              <input type="file" {...register("thumbnailFile")} accept="image/jpeg,image/png" className="form-input" />
            </div>

            {thumbnailPreview && (
               <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Preview</label>
                  <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-48 aspect-video object-cover rounded-md border" />
               </div>
            )}
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