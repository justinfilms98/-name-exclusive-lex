import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;
    
    // Get collection data
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', collectionId)
      .single();

    if (collectionError) {
      return NextResponse.json(
        { error: 'Collection not found', details: collectionError },
        { status: 404 }
      );
    }

    // Get purchase data for this collection
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('*')
      .eq('collection_id', collectionId);

    // Try to get signed URLs for photos
    let photoUrls: string[] = [];
    if (collection.photo_paths && collection.photo_paths.length > 0) {
      const photoPromises = collection.photo_paths.map(async (path: string, index: number) => {
        try {
          const { data, error } = await supabase.storage
            .from('media')
            .createSignedUrl(path, 3600);
          
          if (error) {
            return { path, error: error.message, index };
          }
          return { path, url: data?.signedUrl, index };
        } catch (err) {
          return { path, error: 'Exception occurred', index };
        }
      });

      const results = await Promise.all(photoPromises);
      photoUrls = results.map(r => r.url).filter(Boolean);
    }

    return NextResponse.json({
      collection: {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        price: collection.price,
        duration: collection.duration,
        video_path: collection.video_path,
        thumbnail_path: collection.thumbnail_path,
        photo_paths: collection.photo_paths,
        photo_count: collection.photo_paths?.length || 0,
        created_at: collection.created_at,
        updated_at: collection.updated_at
      },
      purchases: purchases || [],
      photo_debug: {
        paths_found: collection.photo_paths?.length || 0,
        urls_generated: photoUrls.length,
        photo_paths: collection.photo_paths,
        photo_urls: photoUrls
      },
      database_info: {
        collection_exists: !!collection,
        purchase_count: purchases?.length || 0
      }
    });

  } catch (error) {
    console.error('Debug collection error:', error);
    return NextResponse.json(
      { error: 'Failed to debug collection', details: error },
      { status: 500 }
    );
  }
} 