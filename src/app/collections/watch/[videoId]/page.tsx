import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { videoId: string };
  searchParams: { token?: string };
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function WatchPage({ params, searchParams }: PageProps) {
  const videoId = params.videoId;
  const tokenValue = searchParams.token;
  if (!tokenValue) return notFound();

  // 1) Validate token
  const { data: tokenRow, error: tokenError } = await supabaseAdmin
    .from('purchase_tokens')
    .select('user_id, video_id, expires_at')
    .eq('token', tokenValue)
    .single();
  if (tokenError || !tokenRow) return notFound();
  if (
    tokenRow.video_id.toString() !== videoId ||
    new Date(tokenRow.expires_at).getTime() < Date.now()
  ) {
    return notFound();
  }

  // 2) Fetch video metadata
  const { data: video, error: videoError } = await supabaseAdmin
    .from('CollectionVideo')
    .select('id, title, storagePath')
    .eq('id', Number(videoId))
    .single();
  if (videoError || !video) return notFound();

  // 3) Create signed URL
  const { data: signedData, error: signedError } = await supabaseAdmin
    .storage
    .from('videos') // replace with your actual bucket name if different
    .createSignedUrl(video.storagePath, 60 * 60);
  if (signedError || !signedData?.signedUrl) return notFound();
  const videoUrl = signedData.signedUrl;

  // 4) Render video player
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-4">{video.title}</h1>
      <video
        controls
        width="100%"
        src={videoUrl}
        className="rounded-lg shadow-lg"
      />
    </div>
  );
} 