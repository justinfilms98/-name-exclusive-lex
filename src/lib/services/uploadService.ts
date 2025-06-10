import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { Upload } from 'tus-js-client';

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
  uploadedBytes?: number;
  totalBytes?: number;
  currentChunk?: number;
  totalChunks?: number;
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
const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for better progress tracking

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
  let extension = originalName.split('.').pop();
  if (!extension || extension === originalName) {
    extension = type === 'thumbnail' ? 'jpg' : 'mp4';
  }
  return `${type}-${slotOrder}-${timestamp}.${extension}`;
}

// Helper to format bytes for display
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Main upload function
export async function uploadFile(
  file: File,
  type: UploadType,
  slotOrder: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  console.log('[uploadFile] Start', { 
    file: { name: file.name, size: formatBytes(file.size), type: file.type },
    type,
    slotOrder 
  });

  // Validate file
  const validationError = await validateFile(file, type === 'thumbnail' ? 'image' : 'video');
  if (validationError) {
    console.error('[uploadFile] Validation failed:', validationError);
    throw new Error(validationError);
  }
  console.log('[uploadFile] Validation passed');

  const filename = generateUniqueFilename(file.name, type, slotOrder);
  const bucket = type === 'thumbnail' ? 'thumbnails' : 'videos';
  const path = filename;

  if (type === 'video') {
    // Use anon key direct upload for files <= 100MB
    if (file.size <= 100 * 1024 * 1024) {
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      if (!publicUrl) throw new Error('No publicUrl from upload');
      if (onProgress) {
        onProgress({
          progress: 100,
          status: 'complete',
          uploadedBytes: file.size,
          totalBytes: file.size,
          currentChunk: 1,
          totalChunks: 1
        });
      }
      return {
        url: publicUrl,
        path,
        metadata: {
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        },
      };
    }
    // Guard: Ensure Supabase access token is present before TUS upload
    let session: any = undefined;
    if (typeof window !== 'undefined') {
      const { data } = await supabase.auth.getSession();
      session = data.session;
      if (!session?.access_token) {
        alert('Your session has expired or you are not logged in. Please log in to upload files.');
        throw new Error('No Supabase access token found');
      }
    }
    if (!session?.access_token) {
      throw new Error('No Supabase access token');
    }
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const endpoint = `${projectUrl}/storage/v1/object/resumable?bucket=${bucket}&object=${path}`;
    return new Promise<UploadResult>((resolve, reject) => {
      const upload = new Upload(file, {
        endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: bucket,
          objectName: path,
          contentType: file.type,
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024, // 6MB chunks as required by Supabase
        onError: function (error) {
          if (onProgress) onProgress({ progress: 0, status: 'error', error: error.message });
          reject(error);
        },
        onProgress: function (bytesUploaded, bytesTotal) {
          const progress = Math.round((bytesUploaded / bytesTotal) * 100);
          if (onProgress) onProgress({ progress, status: 'uploading', uploadedBytes: bytesUploaded, totalBytes: bytesTotal });
        },
        onSuccess: function () {
          const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
          if (!publicUrl) {
            const err = new Error('Failed to get public URL');
            if (onProgress) onProgress({ progress: 0, status: 'error', error: err.message });
            reject(err);
            return;
          }
          if (onProgress) onProgress({ progress: 100, status: 'complete', uploadedBytes: file.size, totalBytes: file.size });
          resolve({
            url: publicUrl,
            path,
            metadata: {
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
            },
          });
        },
      });
      upload.findPreviousUploads().then(function (previousUploads) {
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      });
    });
  } else {
    // Use standard upload for thumbnails
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: true
      });
    if (error) {
      throw error;
    }
    if (!data || !data.path) {
      throw new Error('No data/path from upload');
    }
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    if (!publicUrl) {
      throw new Error('No publicUrl from upload');
    }
    if (onProgress) {
      onProgress({
        progress: 100,
        status: 'complete',
        uploadedBytes: file.size,
        totalBytes: file.size,
        currentChunk: 1,
        totalChunks: 1
      });
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