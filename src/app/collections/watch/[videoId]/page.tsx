import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import VideoPlayer from './VideoPlayer';

// Correct signature for a dynamic route page in Next.js App Router
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
    redirect('/collections?access=denied');
  }

  const video = purchase.CollectionVideo;
  const expiresAt = purchase.expiresAt?.toISOString();

  return (
    <VideoPlayer src={video.videoUrl} title={video.title} expiresAt={expiresAt} />
  );
} 