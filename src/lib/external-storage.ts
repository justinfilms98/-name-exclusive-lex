// External Storage Solution for Large Files
// Since Supabase free tier is limited to 50MB, we'll use external storage for larger files

export interface ExternalStorageConfig {
  provider: 'cloudinary' | 'aws-s3' | 'google-cloud';
  apiKey: string;
  apiSecret: string;
  bucket?: string;
  folder?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

// Cloudinary implementation (free tier allows 100MB files)
export const uploadToCloudinary = async (
  file: File, 
  config: ExternalStorageConfig
): Promise<UploadResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.folder || 'exclusive_lex');
    formData.append('cloud_name', config.apiKey);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.apiKey}/video/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message || 'Upload failed'
      };
    }

    return {
      success: true,
      url: data.secure_url,
      path: data.public_id
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
};

// AWS S3 implementation
export const uploadToS3 = async (
  file: File,
  config: ExternalStorageConfig
): Promise<UploadResult> => {
  try {
    // This would require AWS SDK implementation
    // For now, return error suggesting setup
    return {
      success: false,
      error: 'AWS S3 upload not yet implemented. Please configure Cloudinary or upgrade to Supabase Pro.'
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
};

// Main upload function that chooses the right provider
export const uploadLargeFile = async (
  file: File,
  config: ExternalStorageConfig
): Promise<UploadResult> => {
  switch (config.provider) {
    case 'cloudinary':
      return await uploadToCloudinary(file, config);
    case 'aws-s3':
      return await uploadToS3(file, config);
    default:
      return {
        success: false,
        error: 'Unsupported storage provider'
      };
  }
}; 