import { z } from 'zod';

// Validation schemas
const fileValidationSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['video', 'photo']),
  maxSize: z.number(),
  allowedTypes: z.array(z.string()),
});

// Types
export type MediaType = 'video' | 'photo';
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
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

// Helper to validate file
async function validateFile(file: File, type: MediaType): Promise<string | null> {
  try {
    const validation = fileValidationSchema.parse({
      file,
      type,
      maxSize: type === 'photo' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE,
      allowedTypes: type === 'photo' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES,
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
function generateUniqueFilename(originalName: string, type: MediaType, collectionId: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  let extension = originalName.split('.').pop();
  if (!extension || extension === originalName) {
    extension = type === 'photo' ? 'jpg' : 'mp4';
  }
  return `${type}-${collectionId}-${timestamp}-${randomId}.${extension}`;
}

// Main upload function for collection media
export async function uploadCollectionMedia(
  file: File,
  type: MediaType,
  collectionId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  console.log('[uploadCollectionMedia] Start', { file, type, collectionId });
  
  // Validate file
  const validationError = await validateFile(file, type);
  if (validationError) {
    console.error('[uploadCollectionMedia] Validation failed:', validationError);
    throw new Error(validationError);
  }
  console.log('[uploadCollectionMedia] Validation passed');

  const filename = generateUniqueFilename(file.name, type, collectionId);
  const filePath = `media/${collectionId}/${filename}`;
  
  console.log('[uploadCollectionMedia] Uploading to media bucket with path', filePath);

  try {
    // Update progress
    onProgress?.({ progress: 0, status: 'uploading' });

    // TODO: Integrate UploadThing upload logic here. All Supabase code removed.

    if (!data || !data.path) {
      console.error('[uploadCollectionMedia] No data or path returned from upload', data);
      throw new Error('No data/path from upload');
    }

    console.log('[uploadCollectionMedia] Upload successful', data);
    
    // Update progress
    onProgress?.({ progress: 100, status: 'complete' });

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path);
    const publicUrl = urlData.publicUrl;
    
    if (!publicUrl) {
      console.error('[uploadCollectionMedia] No publicUrl returned', data);
      throw new Error('No publicUrl from upload');
    }

    console.log('[uploadCollectionMedia] publicUrl:', publicUrl);
    
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
    console.error('[uploadCollectionMedia] Caught error:', err);
    onProgress?.({ progress: 0, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' });
    throw err;
  }
}

// Helper to delete file from collection media
export async function deleteCollectionMedia(path: string): Promise<void> {
  const { error } = await supabase.storage.from('media').remove([path]);
  if (error) {
    console.error('[deleteCollectionMedia] Error deleting file:', error);
    throw error;
  }
}

// Helper to get public URL for a file
export function getCollectionMediaUrl(path: string): string {
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  return data.publicUrl;
}

// This file is now a placeholder. 