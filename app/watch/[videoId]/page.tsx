import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { notFound } from 'next/navigation';

interface WatchPageProps {
  params: { videoId: string };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { videoId } = params;
  // Fetch the video path from the database
  const { data: videoData, error: videoError } = await supabaseAdmin
    .from('collection_videos')
    .select('videoPath')
    .eq('id', videoId)
    .single();

  if (videoError || !videoData) {
    return notFound();
  }

  // Generate a signed URL for the video
  const { data: signedURLData, error: signedURLError } = await supabaseAdmin
    .storage
    .from('videos')
    .createSignedUrl(videoData.videoPath, 60 * 60);

  if (signedURLError || !signedURLData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Could not load video</h1>
        <p>{signedURLError.message}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Enjoy your video</h1>
      <video width="100%" height="auto" controls>
        <source src={signedURLData.signedUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
} 