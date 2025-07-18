import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import VideoPlayerClientWrapper from './VideoPlayerClientWrapper';

// Use 'any' for params to bypass Next.js 15 type error
export default async function WatchCollectionVideoPage({ params }: any) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user || !(session.user as any).id) {
    redirect('/login?redirectTo=/collections');
  }

  // Fetch purchase data from API route instead of direct Prisma access
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/verify-purchase-access?videoId=${params.videoId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    redirect('/collections');
  }

  const data = await response.json();
  const { purchase } = data;
  const { CollectionVideo } = purchase;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{CollectionVideo.title}</h1>
      <VideoPlayerClientWrapper
        src={CollectionVideo.videoUrl}
        title={CollectionVideo.title}
        expiresAt={purchase.expiresAt}
      />
    </div>
  );
} 