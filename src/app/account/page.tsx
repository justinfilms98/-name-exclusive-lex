import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AccountClient from './AccountClient';

// Define a specific type for our combined history object to ensure type safety
interface PurchaseHistoryItem {
  id: number;
  purchaseDate: Date;
  expiresAt: Date | null;
  video: {
    id: string;
    title: string;
    description: string;
    thumbnailPath: string | null;
    price: number;
  };
}

async function getPurchaseHistory(userId: string): Promise<PurchaseHistoryItem[]> {
  // Fetch purchases with correct relation casing
  const purchases = await prisma.purchase.findMany({
    where: { userId },
    include: {
      CollectionVideo: true, // Correct casing from schema
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch timed access records - use type assertion since TypeScript doesn't recognize it
  const timedAccessRecords = await (prisma as any).timedAccess.findMany({
    where: { userId },
  });

  // Build lookup map
  const accessMap = new Map(
    timedAccessRecords.map((record: any) => [record.videoId, record.expiresAt])
  );

  // Merge data
  const purchaseHistory = purchases
    .map(p => {
      if (!p.CollectionVideo) return null;

      const item: PurchaseHistoryItem = {
        id: parseInt(p.id as any), // Convert to number
        purchaseDate: p.createdAt as Date,
        expiresAt: accessMap.get(p.videoId.toString()) as Date | null,
        video: {
          id: p.CollectionVideo.id.toString(),
          title: p.CollectionVideo.title,
          description: p.CollectionVideo.description,
          thumbnailPath: p.CollectionVideo.thumbnailPath,
          price: p.CollectionVideo.price,
        },
      };
      return item;
    })
    .filter((p): p is PurchaseHistoryItem => p !== null);

  return purchaseHistory;
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/signin?callbackUrl=/account');
  }

  // Get user ID from email since session doesn't have ID
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    redirect('/signin?callbackUrl=/account');
  }

  const history = await getPurchaseHistory(user.id);

  return <AccountClient purchases={history} />;
}