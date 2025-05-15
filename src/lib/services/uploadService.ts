import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Validation schemas
const fileValidationSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['image', 'video']),
  maxSize: z.number(),
  allowedTypes: z.array(z.string()),
});

// Types
export type UploadType = 'thumbnail' | 'video';
export type UploadProgress = {
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
};

export type UploadResult = {
  url: string;
  path: string;
  metadata: {
    size: number;
    type: string;
    lastModified: number;
  };
};

// Constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Helper to validate file
async function validateFile(file: File, type: 'image' | 'video'): Promise<string | null> {
  try {
    const validation = fileValidationSchema.parse({
      file,
      type,
      maxSize: type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE,
      allowedTypes: type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES,
    });

    if (!validation.allowedTypes.includes(file.type)) {
      return `File type ${file.type} not allowed. Allowed types: ${validation.allowedTypes.join(', ')}`;
    }

    if (file.size > validation.maxSize) {
      return `File size must be less than ${validation.maxSize / (1024 * 1024)}MB`;
    }

    return null;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return err.errors[0].message;
    }
    return 'Invalid file';
  }
}

// Helper to generate unique filename
function generateUniqueFilename(originalName: string, type: UploadType, slotOrder: number): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  return `${type}-${slotOrder}-${timestamp}.${extension}`;
}

// Main upload function
export async function uploadFile(
  file: File,
  type: UploadType,
  slotOrder: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Validate file
  const validationError = await validateFile(file, type === 'thumbnail' ? 'image' : 'video');
  if (validationError) {
    throw new Error(validationError);
  }

  // Generate unique filename
  const filename = generateUniqueFilename(file.name, type, slotOrder);
  const bucket = type === 'thumbnail' ? 'thumbnails' : 'videos';

  try {
    // Start upload with progress tracking
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: true,
        onUploadProgress: (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          onProgress?.({
            progress: percent,
            status: 'uploading',
          });
        },
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    // Return result
    return {
      url: publicUrl,
      path: data.path,
      metadata: {
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      },
    };
  } catch (err) {
    onProgress?.({
      progress: 0,
      status: 'error',
      error: err instanceof Error ? err.message : 'Upload failed',
    });
    throw err;
  }
}

// Helper to delete old file
export async function deleteFile(path: string, type: UploadType): Promise<void> {
  const bucket = type === 'thumbnail' ? 'thumbnails' : 'videos';
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

// Helper to generate thumbnail from video
export async function generateThumbnail(videoUrl: string): Promise<string> {
  // TODO: Implement video thumbnail generation
  // This would require a server-side implementation or a third-party service
  throw new Error('Thumbnail generation not implemented');
} 