// Force redeploy to ensure Vercel picks up folder rename
export const dynamic = "force-dynamic";
import { notFound } from 'next/navigation';
import WatchPageClient from './WatchPageClient';

export default async function WatchVideoPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  
  if (!videoId) return notFound();
  
  return <WatchPageClient videoId={videoId} />;
} 