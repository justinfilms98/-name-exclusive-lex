import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { StorageError } from '@supabase/storage-js';

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

// Helper to validate file
async function validateFile(file: File, type: 'image' | 'video'): Promise<string | null> {
  try {
    const validation = fileValidationSchema.parse({
      file,
      type,
      maxSize: type === 'image' ? MAX_IMAGE_SIZE : Infinity, // No limit for videos
      allowedTypes: type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES,
    });

    if (!validation.allowedTypes.includes(file.type)) {
      return `File type ${file.type} not allowed. Allowed types: ${validation.allowedTypes.join(', ')}`;
    }

    if (type === 'image' && file.size > validation.maxSize) {
      return `Image size must be less than ${validation.maxSize / (1024 * 1024)}MB`;
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
  let extension = originalName.split('.').pop();
  if (!extension || extension === originalName) {
    extension = type === 'thumbnail' ? 'jpg' : 'mp4';
  }
  return `${type}-${slotOrder}-${timestamp}.${extension}`;
}

// Main upload function
export async function uploadFile(
  file: File,
  type: UploadType,
  slotOrder: number,
  onProgress?: (progress: UploadProgress) => void,
  supabaseClient = supabase // default to anon client for browser, override with supabaseAdmin for server
): Promise<UploadResult> {
  console.log('[uploadFile] Start', { file, type, slotOrder, fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB` });
  // Validate file
  const validationError = await validateFile(file, type === 'thumbnail' ? 'image' : 'video');
  if (validationError) {
    console.error('[uploadFile] Validation failed:', validationError);
    throw new Error(validationError);
  }
  console.log('[uploadFile] Validation passed');

  const filename = generateUniqueFilename(file.name, type, slotOrder);
  const bucket = type === 'thumbnail' ? 'thumbnails' : 'videos';
  console.log('[uploadFile] Uploading to bucket', bucket, 'with filename', filename);

  try {
    // For videos, use resumable upload
    if (type === 'video') {
      const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true,
          duplex: 'half',
          contentType: file.type,
          onProgress: (progress) => {
            if (onProgress) {
              onProgress({
                progress: (progress.loaded / progress.total) * 100,
                status: 'uploading'
              });
            }
          }
        } as {
          cacheControl: string;
          upsert: boolean;
          duplex?: string;
          contentType: string;
          onProgress?: (progress: { loaded: number; total: number }) => void;
        });

      if (error) {
        console.error('[uploadFile] Supabase upload error:', error);
        // Handle specific Supabase storage errors
        if (error instanceof StorageError) {
          if (error.message.includes('exceeds maximum')) {
            throw new Error(`File size exceeds Supabase storage limit. Please upgrade to Supabase Pro for larger file uploads. Error: ${error.message}`);
          }
          if (error.message.includes('quota')) {
            throw new Error(`Storage quota exceeded. Please upgrade to Supabase Pro for more storage. Error: ${error.message}`);
          }
          throw new Error(`Storage error: ${error.message}`);
        }
        throw error;
      }

      if (!data || !data.path) {
        console.error('[uploadFile] No data or path returned from upload', data);
        throw new Error('No data/path from upload');
      }

      console.log('[uploadFile] Upload successful', data);
      const { publicUrl } = supabaseClient.storage.from(bucket).getPublicUrl(data.path).data;
      if (!publicUrl) {
        console.error('[uploadFile] No publicUrl returned', data);
        throw new Error('No publicUrl from upload');
      }

      return {
        url: publicUrl,
        path: data.path,
        metadata: {
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        },
      };
    } else {
      // For thumbnails, use regular upload since they're small
      const { data, error } = await supabaseClient.storage.from(bucket).upload(filename, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
        onProgress: (progress) => {
          if (onProgress) {
            onProgress({
              progress: (progress.loaded / progress.total) * 100,
              status: 'uploading'
            });
          }
        }
      } as {
        cacheControl: string;
        upsert: boolean;
        contentType: string;
        onProgress?: (progress: { loaded: number; total: number }) => void;
      });

      if (error) {
        console.error('[uploadFile] Supabase upload error:', error);
        // Handle specific Supabase storage errors
        if (error instanceof StorageError) {
          if (error.message.includes('exceeds maximum')) {
            throw new Error(`File size exceeds Supabase storage limit. Please upgrade to Supabase Pro for larger file uploads. Error: ${error.message}`);
          }
          if (error.message.includes('quota')) {
            throw new Error(`Storage quota exceeded. Please upgrade to Supabase Pro for more storage. Error: ${error.message}`);
          }
          throw new Error(`Storage error: ${error.message}`);
        }
        throw error;
      }

      if (!data || !data.path) {
        console.error('[uploadFile] No data or path returned from upload', data);
        throw new Error('No data/path from upload');
      }

      console.log('[uploadFile] Upload successful', data);
      const { publicUrl } = supabaseClient.storage.from(bucket).getPublicUrl(data.path).data;
      if (!publicUrl) {
        console.error('[uploadFile] No publicUrl returned', data);
        throw new Error('No publicUrl from upload');
      }

      return {
        url: publicUrl,
        path: data.path,
        metadata: {
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        },
      };
    }
  } catch (err) {
    console.error('[uploadFile] Caught error:', err);
    if (err instanceof Error) {
      // Add more context to the error message
      if (err.message.includes('exceeds maximum')) {
        throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds Supabase storage limit. Please upgrade to Supabase Pro for larger file uploads.`);
      }
      throw err;
    }
    throw new Error('Upload failed: ' + String(err));
  }
}

// Helper to delete old file
export async function deleteFile(path: string, type: UploadType): Promise<void> {
  const bucket = type === 'thumbnail' ? 'thumbnails' : 'videos';
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

// Helper to generate thumbnail from video
export async function generateThumbnail(): Promise<string> {
  // TODO: Implement video thumbnail generation
  // This would require a server-side implementation or a third-party service
  throw new Error('Thumbnail generation not implemented');
} 