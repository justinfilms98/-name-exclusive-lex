import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const path = formData.get('path') as string;
    
    if (!file || !bucket || !path) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    console.log(`Processing large file upload: ${file.name} (${file.size} bytes)`);

    // Check file size (2GB limit)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: `File size ${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB exceeds 2GB limit`
      }, { status: 400 });
    }

    // Check if bucket exists and get its configuration
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from(bucket)
      .list('', { limit: 1 });

    if (bucketError) {
      console.error('Bucket access error:', bucketError);
      return NextResponse.json({ 
        success: false, 
        error: `Storage bucket error: ${bucketError.message}`,
        details: bucketError
      }, { status: 500 });
    }

    console.log('Bucket accessible, proceeding with upload...');
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.message.includes('maximum allowed size')) {
        errorMessage = 'File size exceeds storage limit. Please ensure the storage bucket is configured for 2GB files.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please check your authentication and storage policies.';
      }
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        details: error,
        fileSize: file.size,
        fileSizeMB: (file.size / 1024 / 1024).toFixed(2)
      }, { status: 500 });
    }

    console.log('Upload successful:', data);
    return NextResponse.json({ 
      success: true, 
      data: data,
      message: 'File uploaded successfully',
      fileSize: file.size,
      fileSizeMB: (file.size / 1024 / 1024).toFixed(2)
    });

  } catch (err: any) {
    console.error('Upload API error:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      stack: err.stack
    }, { status: 500 });
  }
} 