import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function WatchPage({ params, searchParams }) {
  const videoId = params.videoId;
  const tokenValue = searchParams.token;

  // 1) Validate token:
  const { data: tokenRow } = await supabaseAdmin
    .from('VideoTokens')
    .select('*')
    .eq('token', tokenValue)
    .single();

  if (!tokenRow || tokenRow.videoId !== Number(videoId) || Date.now() > new Date(tokenRow.expiresAt).getTime()) {
    notFound();
  }

  // 2) Fetch video metadata:
  const { data: video } = await supabaseAdmin
    .from('CollectionVideo')
    .select('*')
    .eq('id', Number(videoId))
    .single();

  if (!video) {
    notFound();
  }

  // 3) Generate a signed URL to stream the file:
  const { data: signed } = await supabaseAdmin.storage.from('videos').createSignedUrl(video.videoPath, 3600);
  if (!signed?.signedUrl) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1>{video.title}</h1>
      <video controls width="100%" src={signed.signedUrl} />
    </div>
  );
} 