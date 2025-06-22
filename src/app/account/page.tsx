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
      collectionVideo: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const videoIds = purchases.map(p => p.videoId);

  const timedAccessEntries = await prisma.timedAccess.findMany({
    where: {
      userId: userId,
      videoId: { in: videoIds },
    },
  });

  const accessMap = new Map<string, Date>();
  timedAccessEntries.forEach(entry => {
    accessMap.set(entry.videoId.toString(), entry.expiresAt);
  });

  const purchaseHistory = purchases
    .map(p => {
      if (!p.collectionVideo) return null;

      const item: PurchaseHistoryItem = {
        id: p.id,
        purchaseDate: p.createdAt,
        expiresAt: accessMap.get(p.videoId.toString()) as Date | null,
        video: {
          id: p.collectionVideo.id.toString(),
          title: p.collectionVideo.title,
          description: p.collectionVideo.description,
          thumbnailPath: p.collectionVideo.thumbnailPath,
          price: p.collectionVideo.price,
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