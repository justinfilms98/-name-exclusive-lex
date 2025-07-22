import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    // Test file upload to storage
    const testPath = `test/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(testPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 500 });
    }

    // Clean up test file
    await supabase.storage
      .from('media')
      .remove([testPath]);

    return NextResponse.json({ 
      success: true, 
      message: 'Upload test successful',
      data: data
    });

  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      stack: err.stack
    }, { status: 500 });
  }
} 