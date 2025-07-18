import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import VideoPlayer from './VideoPlayer';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

async function getVideoData(videoId: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://exclusivelex.com';
    
    // Fetch purchase data from API route instead of direct Prisma access
    const purchaseResponse = await fetch(`${baseUrl}/api/verify-purchase-access?videoId=${videoId}`, {
      cache: 'no-store',
    });
    
    if (!purchaseResponse.ok) {
      throw new Error('Failed to verify purchase access');
    }
    
    const purchaseData = await purchaseResponse.json();
    
    if (!purchaseData.hasAccess) {
      throw new Error('Access denied');
    }
    
    // Fetch video data
    const videoResponse = await fetch(`${baseUrl}/api/media/${videoId}`, {
      cache: 'no-store',
    });
    
    if (!videoResponse.ok) {
      throw new Error('Failed to fetch video data');
    }
    
    const videoData = await videoResponse.json();
    
    return {
      src: videoData.videoUrl,
      title: videoData.title,
      expiresAt: purchaseData.expiresAt
    };
  } catch (error) {
    console.error('Error fetching video data:', error);
    return null;
  }
}

export default async function WatchPage({ params }: { params: { videoId: string } }) {
  const videoData = await getVideoData(params.videoId);

  if (!videoData) {
    notFound();
  }

  return (
    <Suspense fallback={<div>Loading video...</div>}>
      <VideoPlayer 
        src={videoData.src}
        title={videoData.title}
        expiresAt={videoData.expiresAt}
      />
    </Suspense>
  );
} 