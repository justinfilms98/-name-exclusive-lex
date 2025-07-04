// Force redeploy to ensure Vercel picks up folder rename
export const dynamic = "force-dynamic";
import { notFound } from 'next/navigation';

export default function WatchVideoPage({ params }: { params: { videoId: string } }) {
  if (!params.videoId) return notFound();
  return (
    <div style={{ color: 'white', textAlign: 'center', marginTop: 100 }}>
      <h1>Watch Video: {params.videoId}</h1>
      {/* Add your video player or logic here */}
    </div>
  );
} 