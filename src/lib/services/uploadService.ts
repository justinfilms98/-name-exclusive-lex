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
  let extension = originalName.split('.').pop();
  if (!extension || extension === originalName) {
    extension = type === 'thumbnail' ? 'jpg' : 'mp4';
  }
  return `${type}-${slotOrder}-${timestamp}.${extension}`;
}

// Get authenticated user session
async function getAuthenticatedUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('No session - user not authenticated');
  }
  return session.user;
}

// Main upload function with authentication and fallback
export async function uploadFile(
  file: File,
  type: UploadType,
  slotOrder: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  console.log('[uploadFile] Start', { file, type, slotOrder });
  
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
    // First, try to get authenticated user session
    const user = await getAuthenticatedUser();
    console.log('[uploadFile] Authenticated user:', user.id);

    // Try direct upload with authentication
    const { data, error } = await supabase.storage.from(bucket).upload(filename, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

    if (error) {
      console.error('[uploadFile] Direct upload failed, trying signed URL fallback:', error);
      
      // Fallback to signed upload URL
      return await uploadWithSignedUrl(file, bucket, filename, onProgress);
    }

    if (!data || !data.path) {
      console.error('[uploadFile] No data or path returned from upload', data);
      throw new Error('No data/path from upload');
    }

    console.log('[uploadFile] Direct upload successful', data);
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    
    if (!urlData.publicUrl) {
      console.error('[uploadFile] No publicUrl returned', data);
      throw new Error('No publicUrl from upload');
    }

    console.log('[uploadFile] publicUrl:', urlData.publicUrl);
    return {
      url: urlData.publicUrl,
      path: data.path,
      metadata: {
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      },
    };
  } catch (err) {
    console.error('[uploadFile] Caught error:', err);
    throw err;
  }
}

// Fallback upload using signed URL
async function uploadWithSignedUrl(
  file: File,
  bucket: string,
  filename: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  console.log('[uploadWithSignedUrl] Starting signed URL upload');
  
  try {
    // Get signed upload URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filename);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[uploadWithSignedUrl] Failed to get signed URL:', signedUrlError);
      throw new Error('Failed to get signed upload URL');
    }

    console.log('[uploadWithSignedUrl] Got signed URL, uploading file');

    // Upload file using signed URL
    const uploadResponse = await fetch(signedUrlData.signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      console.error('[uploadWithSignedUrl] Upload failed:', uploadResponse.status, uploadResponse.statusText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    console.log('[uploadWithSignedUrl] Upload successful');

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
    
    if (!urlData.publicUrl) {
      throw new Error('No publicUrl after upload');
    }

    return {
      url: urlData.publicUrl,
      path: filename,
      metadata: {
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      },
    };
  } catch (err) {
    console.error('[uploadWithSignedUrl] Error:', err);
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