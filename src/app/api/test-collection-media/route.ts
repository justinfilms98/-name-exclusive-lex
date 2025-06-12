import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // Test database connection
    const collections = await prisma.collection.findMany({
      take: 1
    });

    // Test Supabase connection
    const { data: storageData, error: storageError } = await supabaseAdmin.storage
      .from('media')
      .list('', { limit: 1 });

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        collectionsCount: collections.length
      },
      supabase: {
        connected: !storageError,
        storageAccessible: !storageError
      },
      message: 'Collection Media System is working correctly!'
    });
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'System test failed',
      details: String(error)
    }, { status: 500 });
  }
} 