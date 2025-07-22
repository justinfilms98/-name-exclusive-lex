import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Testing storage configuration...');

    // Test 1: Check if media bucket exists and is accessible
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from('media')
      .list('', { limit: 1 });

    if (bucketError) {
      return NextResponse.json({ 
        success: false, 
        error: `Bucket access failed: ${bucketError.message}`,
        details: bucketError
      }, { status: 500 });
    }

    // Test 2: Try to get bucket info (this might not be available in client SDK)
    const bucketInfo = {
      name: 'media',
      accessible: true,
      files: bucketData?.length || 0
    };

    // Test 3: Create a small test file to verify upload works
    const testContent = 'This is a test file for storage configuration verification.';
    const testFile = new File([testContent], 'test-config.txt', { type: 'text/plain' });
    
    const testPath = `test/config-test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(testPath, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json({ 
        success: false, 
        error: `Test upload failed: ${uploadError.message}`,
        details: uploadError,
        bucketInfo
      }, { status: 500 });
    }

    // Clean up test file
    await supabase.storage
      .from('media')
      .remove([testPath]);

    return NextResponse.json({ 
      success: true, 
      message: 'Storage configuration test passed',
      bucketInfo,
      testUpload: {
        path: testPath,
        size: testFile.size,
        success: true
      },
      recommendations: [
        'Storage bucket is accessible',
        'File uploads are working',
        'Run fix-storage-size-limits.sql in Supabase SQL Editor to configure 2GB limits'
      ]
    });

  } catch (err: any) {
    console.error('Storage config test failed:', err);
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      stack: err.stack
    }, { status: 500 });
  }
} 