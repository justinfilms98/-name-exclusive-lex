import { prisma } from '@/lib/prisma';
import CollectionsClient from './CollectionsClient';

export const revalidate = 60; // Revalidate data at most every 60 seconds

async function getMediaItems() {
  try {
    const mediaItems = await prisma.mediaItem.findMany({
      where: {
        price: {
          gt: 0, // Only show items that have a price
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return mediaItems;
  } catch (error) {
    console.error('Failed to fetch media items:', error);
    return []; // Return an empty array on error
  }
}

export default async function CollectionsPage() {
  const items = await getMediaItems();

  return <CollectionsClient items={items} />;
} 