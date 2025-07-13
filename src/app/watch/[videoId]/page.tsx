// Force redeploy to ensure Vercel picks up folder rename
export const dynamic = "force-dynamic";
import { notFound } from 'next/navigation';
import WatchPageClient from './WatchPageClient';

export default function WatchVideoPage({ params }: any) {
  if (!params.videoId) return notFound();
  
  return <WatchPageClient videoId={params.videoId} />;
} 