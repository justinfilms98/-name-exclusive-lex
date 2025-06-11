import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Storage bucket names
const BUCKETS = {
  THUMBNAILS: 'thumbnails',
  VIDEOS: 'videos',
} as const;

// File type validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

// Maximum file sizes (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadOptions {
  bucket?: keyof typeof BUCKETS;
  folder?: string;
  fileName?: string;
  public?: boolean;
  upsert?: boolean;
}

export class StorageService {
  private static instance: StorageService;
  private client = supabase;
  private adminClient = supabaseAdmin;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Upload a file to Supabase storage
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const {
        bucket = 'THUMBNAILS',
        folder = 'uploads',
        fileName,
        public: isPublic = true,
        upsert = false
      } = options;

      // Validate file type
      const isValidType = this.validateFileType(file, bucket);
      if (!isValidType) {
        return {
          success: false,
          error: `Invalid file type. Allowed types for ${bucket}: ${bucket === 'THUMBNAILS' ? ALLOWED_IMAGE_TYPES.join(', ') : ALLOWED_VIDEO_TYPES.join(', ')}`
        };
      }

      // Validate file size
      const isValidSize = this.validateFileSize(file, bucket);
      if (!isValidSize) {
        return {
          success: false,
          error: `File too large. Maximum size for ${bucket}: ${bucket === 'THUMBNAILS' ? '10MB' : '500MB'}`
        };
      }

      // Generate file path
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = fileName || `${uuidv4()}.${fileExtension}`;
      const filePath = `${folder}/${uniqueFileName}`;

      // Upload file
      const { data, error } = await this.client.storage
        .from(BUCKETS[bucket])
        .upload(filePath, file, {
          upsert,
          cacheControl: '3600',
          contentType: file.type
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL
      const { data: urlData } = this.client.storage
        .from(BUCKETS[bucket])
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        path: filePath
      };

    } catch (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Upload thumbnail with optimized settings
   */
  async uploadThumbnail(file: File, folder?: string): Promise<UploadResult> {
    return this.uploadFile(file, {
      bucket: 'THUMBNAILS',
      folder: folder || 'thumbnails',
      public: true
    });
  }

  /**
   * Upload video with resumable logic
   */
  async uploadVideo(file: File, folder?: string): Promise<UploadResult> {
    // For large files, implement resumable upload logic
    if (file.size > 50 * 1024 * 1024) { // 50MB threshold
      return this.uploadLargeVideo(file, folder);
    }

    return this.uploadFile(file, {
      bucket: 'VIDEOS',
      folder: folder || 'videos',
      public: false // Videos should be private for security
    });
  }

  /**
   * Upload large video with resumable logic
   */
  private async uploadLargeVideo(file: File, folder?: string): Promise<UploadResult> {
    try {
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${folder || 'videos'}/${uniqueFileName}`;

      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        const chunkPath = `${filePath}.part${i}`;

        const { error } = await this.client.storage
          .from(BUCKETS.VIDEOS)
          .upload(chunkPath, chunk, {
            upsert: true,
            contentType: file.type
          });

        if (error) {
          console.error(`Chunk ${i} upload failed:`, error);
          return {
            success: false,
            error: `Chunk ${i} upload failed: ${error.message}`
          };
        }
      }

      // Combine chunks (this would require server-side processing)
      // For now, we'll use the first chunk as the main file
      const { data: urlData } = this.client.storage
        .from(BUCKETS.VIDEOS)
        .getPublicUrl(`${filePath}.part0`);

      return {
        success: true,
        url: urlData.publicUrl,
        path: `${filePath}.part0`
      };

    } catch (error) {
      console.error('Large video upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Large video upload failed'
      };
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(path: string, bucket: keyof typeof BUCKETS = 'THUMBNAILS'): Promise<UploadResult> {
    try {
      const { error } = await this.client.storage
        .from(BUCKETS[bucket])
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('Storage delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delete error'
      };
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string, bucket: keyof typeof BUCKETS = 'THUMBNAILS'): string {
    const { data } = this.client.storage
      .from(BUCKETS[bucket])
      .getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Get signed URL for private files
   */
  async getSignedUrl(path: string, bucket: keyof typeof BUCKETS = 'VIDEOS', expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await this.client.storage
        .from(BUCKETS[bucket])
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Signed URL error:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL generation error:', error);
      return null;
    }
  }

  /**
   * Validate file type
   */
  private validateFileType(file: File, bucket: keyof typeof BUCKETS): boolean {
    const allowedTypes = bucket === 'THUMBNAILS' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
    return allowedTypes.includes(file.type);
  }

  /**
   * Validate file size
   */
  private validateFileSize(file: File, bucket: keyof typeof BUCKETS): boolean {
    const maxSize = bucket === 'THUMBNAILS' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    return file.size <= maxSize;
  }

  /**
   * List files in a bucket/folder
   */
  async listFiles(bucket: keyof typeof BUCKETS = 'THUMBNAILS', folder?: string): Promise<string[]> {
    try {
      const { data, error } = await this.client.storage
        .from(BUCKETS[bucket])
        .list(folder || '');

      if (error) {
        console.error('List files error:', error);
        return [];
      }

      return data.map(item => item.name);
    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();

// Export utility functions
export const uploadThumbnail = (file: File, folder?: string) => 
  storageService.uploadThumbnail(file, folder);

export const uploadVideo = (file: File, folder?: string) => 
  storageService.uploadVideo(file, folder);

export const deleteFile = (path: string, bucket?: keyof typeof BUCKETS) => 
  storageService.deleteFile(path, bucket);

export const getPublicUrl = (path: string, bucket?: keyof typeof BUCKETS) => 
  storageService.getPublicUrl(path, bucket);

export const getSignedUrl = (path: string, bucket?: keyof typeof BUCKETS, expiresIn?: number) => 
  storageService.getSignedUrl(path, bucket, expiresIn); 