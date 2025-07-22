import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('collections')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 500 });
    }

    // Test storage bucket access
    const { data: storageData, error: storageError } = await supabase.storage
      .from('media')
      .list('', { limit: 1 });

    if (storageError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Storage access failed',
        storageError: storageError.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection working',
      collections: data,
      storage: storageData
    });

  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err.message,
      stack: err.stack
    }, { status: 500 });
  }
} 