import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AccountClient from './AccountClient';
import { PurchaseHistoryItem } from '@/lib/types';

async function getPurchaseHistory(userId: string): Promise<PurchaseHistoryItem[]> {
  const purchases = await (prisma as any).purchase.findMany({
    where: { userId },
    include: {
      collectionVideo: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const videoIds = purchases.map((p: any) => p.videoId);

  const timedAccessRecords = await (prisma as any).timedAccess.findMany({
    where: {
      userId,
      videoId: { in: videoIds },
    },
  });

  const accessMap = new Map(
    timedAccessRecords.map((record: any) => [record.videoId.toString(), record.expiresAt])
  );

  const purchaseHistory = purchases
    .map((p: any) => {
      if (!p.collectionVideo) return null;

      return {
        id: p.id,
        purchaseDate: p.createdAt,
        expiresAt: accessMap.get(p.videoId.toString()) || null,
        video: {
          id: p.collectionVideo.id.toString(),
          title: p.collectionVideo.title,
          description: p.collectionVideo.description,
          thumbnailPath: p.collectionVideo.thumbnailPath,
          price: p.collectionVideo.price,
        },
      };
    })
    .filter((item: any): item is PurchaseHistoryItem => item !== null);

  return purchaseHistory;
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/signin?callbackUrl=/account');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });

  if (!user) {
    redirect('/signin?callbackUrl=/account');
  }

  const history = await getPurchaseHistory(user.id);

  return <AccountClient purchases={history} />;
}
