"use client";
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';

// Define the form schema for validation
const formSchema = z.object({
  mediaType: z.enum(['video', 'photo']).default('video'),
  collectionId: z.string().min(1, 'Please select a collection.'),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  videoFile: z.any().refine(file => file?.[0] instanceof File, 'A video file is required.'),
  thumbnailFile: z.any().optional(),
  price: z.number().min(0, 'Price must be a valid number.'),
  duration: z.number().min(1, 'Duration must be at least 1 minute.'),
  seoTags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Collection {
  id: string;
  name: string;
}

interface CollectionVideoModalProps {
  open: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  initialData?: any | null;
  slotOrder: number;
}

export default function CollectionVideoModal({ open, onClose, onSaveSuccess, initialData, slotOrder }: CollectionVideoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      mediaType: 'video',
      price: 0,
      duration: 1,
    }
  });

  const thumbnailFile = watch('thumbnailFile');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Fetch collections on component mount
  useEffect(() => {
    if (open) {
      fetchCollections();
    }
  }, [open]);

  useEffect(() => {
    // Reset form when modal opens or initialData changes
    if (open && initialData) {
      reset({ 
        title: initialData.title, 
        description: initialData.description,
        mediaType: 'video',
        price: initialData.price || 0,
        duration: initialData.duration || 1,
        collectionId: initialData.collectionId || '',
      });
    } else if (open) {
      reset({ 
        title: '', 
        description: '',
        mediaType: 'video',
        price: 0,
        duration: 1,
        collectionId: '',
      });
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

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();
      
      if (response.ok) {
        setCollections(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch collections');
      }
    } catch (error) {
      setError('Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Reusable direct-to-storage upload function
  const uploadToSupabase = async (file: File, collection: string) => {
    const signedUrlRes = await fetch('/api/admin/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileType: file.type, collection }),
    });
    
    if (!signedUrlRes.ok) {
      const errorData = await signedUrlRes.json();
      throw new Error(errorData.error || 'Could not get signed URL.');
    }
    
    const { signedUrl, path } = await signedUrlRes.json();
    if (!signedUrl) throw new Error('Could not get signed URL.');
    
    const uploadRes = await fetch(signedUrl, { 
      method: 'PUT', 
      headers: { 'Content-Type': file.type }, 
      body: file 
    });
    
    if (!uploadRes.ok) {
      throw new Error('Failed to upload file to storage.');
    }
    
    return path;
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const videoFile = data.videoFile[0];
      const thumbFile = data.thumbnailFile?.[0];

      // Upload video file
      const videoPath = await uploadToSupabase(videoFile, 'collection-videos');
      
      // Upload thumbnail if provided
      let thumbnailPath: string | undefined;
      if (thumbFile) {
        thumbnailPath = await uploadToSupabase(thumbFile, 'collection-videos/thumbnails');
      }

      // Create database record
      const response = await fetch('/api/collection-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: data.collectionId,
          mediaType: data.mediaType,
          title: data.title,
          description: data.description,
          videoPath,
          thumbnailPath,
          price: data.price,
          duration: data.duration,
          seoTags: data.seoTags,
          order: slotOrder,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save collection video.');
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
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif text-stone-800">{initialData ? 'Edit' : 'Add'} Collection Video</h2>
            <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-800">
              <X size={24} />
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

          <div className="space-y-6">
            {/* Media Type Selection */}
            <div>
              <label htmlFor="mediaType" className="block text-sm font-medium text-stone-700 mb-1">Media Type</label>
              <select {...register("mediaType")} className="form-input">
                <option value="video">Video</option>
                <option value="photo">Photo</option>
              </select>
            </div>

            {/* Collection Selection */}
            <div>
              <label htmlFor="collectionId" className="block text-sm font-medium text-stone-700 mb-1">Collection *</label>
              <select {...register("collectionId")} className="form-input" disabled={loading}>
                <option value="">Select a collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
              {errors.collectionId && <p className="form-error">{errors.collectionId.message}</p>}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1">Title *</label>
              <input {...register("title")} className="form-input" placeholder="Enter video title" />
              {errors.title && <p className="form-error">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-1">Description *</label>
              <textarea {...register("description")} rows={4} className="form-textarea" placeholder="Enter video description" />
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>

            {/* Video File Upload */}
            <div>
              <label htmlFor="videoFile" className="block text-sm font-medium text-stone-700 mb-1">Video File *</label>
              <input type="file" {...register("videoFile")} accept="video/mp4,video/webm,video/ogg" className="form-input" />
              {errors.videoFile && <p className="form-error">{errors.videoFile.message as string}</p>}
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label htmlFor="thumbnailFile" className="block text-sm font-medium text-stone-700 mb-1">Thumbnail (Optional)</label>
              <input type="file" {...register("thumbnailFile")} accept="image/jpeg,image/png,image/webp" className="form-input" />
            </div>

            {/* Thumbnail Preview */}
            {thumbnailPreview && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Thumbnail Preview</label>
                <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-48 aspect-video object-cover rounded-md border" />
              </div>
            )}

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-stone-700 mb-1">Price (USD) *</label>
              <input 
                type="number" 
                {...register("price", { valueAsNumber: true })} 
                min="0" 
                step="0.01" 
                className="form-input" 
                placeholder="0.00"
              />
              {errors.price && <p className="form-error">{errors.price.message}</p>}
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-stone-700 mb-1">Duration (minutes) *</label>
              <input 
                type="number" 
                {...register("duration", { valueAsNumber: true })} 
                min="1" 
                className="form-input" 
                placeholder="1"
              />
              {errors.duration && <p className="form-error">{errors.duration.message}</p>}
            </div>

            {/* SEO Tags */}
            <div>
              <label htmlFor="seoTags" className="block text-sm font-medium text-stone-700 mb-1">SEO Tags (Optional)</label>
              <input 
                {...register("seoTags")} 
                className="form-input" 
                placeholder="Enter comma-separated tags"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!isValid || isSubmitting || loading} className="px-6 py-2 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors">
              {isSubmitting ? 'Saving...' : 'Save Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 