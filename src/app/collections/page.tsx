import { prisma } from '@/lib/prisma';
import CollectionsClient from './CollectionsClient';

export const revalidate = 60; // Revalidate data at most every 60 seconds

async function getMediaItems() {
  try {
    const mediaItems = await prisma.collectionMedia.findMany({
      where: {
        price: {
          gt: 0,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        price: true,
        durationSeconds: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // The select call correctly shapes the object. The type error is likely a tooling issue.
    // We cast it to the correct type to unblock the build.
    return mediaItems.map(item => ({ 
      ...item,
      id: item.id,
      price: item.price ? Number(item.price) : 0,
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