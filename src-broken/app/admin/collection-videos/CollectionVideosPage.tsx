"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define the form schema for validation
const formSchema = z.object({
  collection: z.string().min(1, 'Collection is required.'),
  mediaType: z.enum(['video', 'photo']),
  mainFile: z.any().refine(file => file instanceof File, 'A video or photo is required.'),
  thumbnailFile: z.any().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.number().min(0, 'Price must be a positive number.'),
  duration: z.number().min(1, 'Duration is required.'),
  seoTags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CollectionVideosPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // Validate on change to enable/disable submit button
    defaultValues: {
      mediaType: 'video',
    }
  });

  const thumbnailFile = watch('thumbnailFile');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  useEffect(() => {
    if (thumbnailFile && thumbnailFile instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(thumbnailFile);
    } else {
      setThumbnailPreview(null);
    }
  }, [thumbnailFile]);

  // Direct-to-storage upload function
  const uploadToSupabase = async (file: File, collection: string) => {
    // 1. Get signed URL
    const signedUrlRes = await fetch('/api/admin/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileType: file.type, collection }),
    });
    const { signedUrl, path, token } = await signedUrlRes.json();
    if (!signedUrl) throw new Error('Could not get signed URL.');

    // 2. Upload file directly to Supabase storage
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!uploadRes.ok) throw new Error('File upload failed.');
    
    return path;
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Step 1: Upload files
      const mainFilePath = await uploadToSupabase(data.mainFile, data.collection);
      let thumbnailPath: string | null = null;
      if (data.thumbnailFile instanceof File) {
        thumbnailPath = await uploadToSupabase(data.thumbnailFile, data.collection);
      }

      // Step 2: Submit metadata to our database
      const response = await fetch('/api/admin/collection-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          videoPath: mainFilePath,
          thumbnailPath: thumbnailPath,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create collection item.');
      }
      
      const newVideo = await response.json();
      setSuccessMessage(`Successfully created "${newVideo.title}"!`);
      // Optionally reset form here
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif text-center text-[#654C37] mb-8">Upload New Content</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {/* Left Column: Form Fields */}
          <div className="space-y-6 bg-white p-8 rounded-lg shadow-subtle">
            {/* Collection Select */}
            <div>
              <label htmlFor="collection" className="block text-sm font-medium text-stone-700 mb-1">Select Collection</label>
              <select {...register("collection")} className="form-select">
                <option value="main">Main Collection</option>
                <option value="special">Special Edition</option>
              </select>
              {errors.collection && <p className="form-error">{errors.collection.message}</p>}
            </div>

            {/* Media Type */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Media Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" value="video" {...register("mediaType")} className="form-radio" /> Video
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" value="photo" {...register("mediaType")} className="form-radio" /> Photo
                </label>
              </div>
            </div>

            {/* Main File Upload */}
            <div>
              <label htmlFor="mainFile" className="block text-sm font-medium text-stone-700 mb-1">Upload Main File</label>
              <input type="file" {...register("mainFile")} accept={watch('mediaType') === 'video' ? 'video/mp4' : 'image/jpeg,image/png'} className="form-input" />
              {errors.mainFile && <p className="form-error">{errors.mainFile.message as string}</p>}
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label htmlFor="thumbnailFile" className="block text-sm font-medium text-stone-700 mb-1">Upload Thumbnail (Optional)</label>
              <input type="file" {...register("thumbnailFile")} accept="image/jpeg,image/png" className="form-input" />
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1">Title</label>
              <input {...register("title")} placeholder="e.g., Sunset Whispers" className="form-input" />
              {errors.title && <p className="form-error">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-1">Description</label>
              <textarea {...register("description")} rows={4} placeholder="A detailed description..." className="form-textarea" />
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>
            
             {/* Price & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-stone-700 mb-1">Price (USD)</label>
                <input type="number" step="0.01" {...register("price", { valueAsNumber: true })} placeholder="19.99" className="form-input" />
                {errors.price && <p className="form-error">{errors.price.message}</p>}
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-stone-700 mb-1">Duration (Mins)</label>
                <input type="number" {...register("duration", { valueAsNumber: true })} placeholder="60" className="form-input" />
                {errors.duration && <p className="form-error">{errors.duration.message}</p>}
              </div>
            </div>

            {/* SEO Tags */}
            <div>
              <label htmlFor="seoTags" className="block text-sm font-medium text-stone-700 mb-1">SEO Tags</label>
              <input {...register("seoTags")} placeholder="tag1, tag2, tag3" className="form-input" />
            </div>
          </div>
          
          {/* Right Column: Preview & Submit */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-lg shadow-subtle">
              <h3 className="text-lg font-semibold text-stone-800 mb-4 border-b pb-2">Live Preview</h3>
              <div className="w-full aspect-video bg-stone-100 rounded-md flex items-center justify-center overflow-hidden">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail Preview" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-stone-400">Thumbnail Preview</span>
                )}
              </div>
              <h4 className="text-xl font-semibold text-stone-800 mt-4 truncate">{watch('title') || 'Your Title Here'}</h4>
              <p className="text-stone-500 text-sm mt-1 line-clamp-2">{watch('description') || 'Your description will appear here...'}</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-subtle">
              <button type="submit" disabled={!isValid || isSubmitting} className="w-full py-3 px-5 rounded-lg font-semibold text-white transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-400">
                {isSubmitting ? 'Uploading...' : 'Submit Content'}
              </button>
              {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
              {successMessage && <p className="text-green-600 mt-4 text-center">{successMessage}</p>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 