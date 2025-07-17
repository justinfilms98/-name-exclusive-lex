import CollectionsClient from './CollectionsClient';

export const revalidate = 60; // Revalidate data at most every 60 seconds

async function getMediaItems() {
  try {
    // Use API route instead of direct Prisma access
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/collections`, {
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch collections');
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
    console.error('Failed to fetch media items:', error);
    return [];
  }
}

export default async function CollectionsPage() {
  const items = await getMediaItems();

  return <CollectionsClient items={items} />;
} 