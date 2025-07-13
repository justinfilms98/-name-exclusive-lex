import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoPlayerClientWrapper from './VideoPlayerClientWrapper';

// Correct explicit prop type for App Router dynamic route
export default async function WatchCollectionVideoPage({ params }: { params: { videoId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login?redirectTo=/collections');
  }

  const purchase = await prisma.purchase.findFirst({
    where: {
      userId: session.user.id,
      collectionVideoId: params.videoId,
      expiresAt: { gt: new Date() },
    },
    include: {
      CollectionVideo: true,
    },
  });

  if (!purchase) {
    redirect('/collections');
  }

  const { CollectionVideo } = purchase;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{CollectionVideo.title}</h1>
      <VideoPlayerClientWrapper
        src={CollectionVideo.videoUrl}
        title={CollectionVideo.title}
        expiresAt={purchase.expiresAt?.toISOString()}
      />
    </div>
  );
} 