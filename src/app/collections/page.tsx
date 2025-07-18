import { Suspense } from 'react';
import CollectionsClient from './CollectionsClient';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

async function getMediaItems() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'https://exclusivelex.com'}/api/collection-videos`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch media items');
    }
    
    const mediaItems = await response.json();
    
    return mediaItems.map((item: any) => ({ 
      ...item,
      id: item.id,
      price: item.price ? Number(item.price) : 0,
      thumbnailUrl: item.thumbnail,
      durationSeconds: null,
    }));
  } catch (error) {
    console.error('Error fetching media items:', error);
    return [];
  }
}

export default async function CollectionsPage() {
  const items = await getMediaItems();

  return (
    <Suspense fallback={<div>Loading collections...</div>}>
      <CollectionsClient items={items} />
    </Suspense>
  );
} 