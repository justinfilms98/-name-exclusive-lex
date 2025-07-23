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
    let photoErrors: any[] = [];
    
    if (collection.photo_paths && collection.photo_paths.length > 0) {
      const photoPromises = collection.photo_paths.map(async (path: string, index: number) => {
        try {
          console.log(`Debug: Trying to load photo ${index + 1} from path:`, path);
          const { data, error } = await supabase.storage
            .from('media')
            .createSignedUrl(path, 3600);
          
          if (error) {
            console.error(`Debug: Failed to load photo ${index + 1}:`, error);
            photoErrors.push({ path, error: error.message, index });
            return null;
          }
          
          console.log(`Debug: Successfully loaded photo ${index + 1}:`, data?.signedUrl);
          return { path, url: data?.signedUrl, index };
        } catch (err) {
          console.error(`Debug: Exception loading photo ${index + 1}:`, err);
          photoErrors.push({ path, error: 'Exception occurred', index });
          return null;
        }
      });

      const results = await Promise.all(photoPromises);
      photoUrls = results.filter(r => r?.url).map(r => r!.url);
    }

    // Check if files exist in storage
    let storageCheck: any[] = [];
    if (collection.photo_paths && collection.photo_paths.length > 0) {
      const storagePromises = collection.photo_paths.map(async (path: string, index: number) => {
        try {
          const { data, error } = await supabase.storage
            .from('media')
            .list(path.split('/').slice(0, -1).join('/'));
          
          return {
            path,
            index,
            exists: !error && data && data.length > 0,
            files: data?.map(f => f.name) || []
          };
        } catch (err) {
          return { path, index, exists: false, error: err };
        }
      });

      storageCheck = await Promise.all(storagePromises);
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
        photo_urls: photoUrls,
        photo_errors: photoErrors,
        storage_check: storageCheck
      },
      database_info: {
        collection_exists: !!collection,
        purchase_count: purchases?.length || 0
      }
    });

  } catch (error) {
    console.error('Debug watch error:', error);
    return NextResponse.json(
      { error: 'Failed to debug watch page', details: error },
      { status: 500 }
    );
  }
} 