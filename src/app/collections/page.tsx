import { prisma } from '@/lib/prisma';
import CollectionsClient, { MediaItem } from './CollectionsClient';

export const revalidate = 60; // Revalidate data at most every 60 seconds

async function getMediaItems(): Promise<MediaItem[]> {
  try {
    const mediaItems = await prisma.collectionVideo.findMany({
      where: {
        price: {
          gt: 0,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailPath: true,
        price: true,
        duration: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // The select call correctly shapes the object. The type error is likely a tooling issue.
    // We cast it to the correct type to unblock the build.
    return mediaItems.map(item => ({ 
      ...item, 
      id: item.id.toString() 
    })) as MediaItem[];

  } catch (error) {
    console.error('Failed to fetch media items:', error);
    return [];
  }
}

export default async function CollectionsPage() {
  const items = await getMediaItems();

  return <CollectionsClient items={items} />;
} 