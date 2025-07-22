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

    // For large files, we'll use a different approach
    // Since Supabase client doesn't support multipart uploads directly,
    // we'll use the regular upload but with better error handling
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data,
      message: 'File uploaded successfully'
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