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
    .from('purchase_tokens')
    .select('*')
    .eq('token', tokenValue)
    .single();

  if (!tokenRow) {
    return <div style={{color: 'red', padding: 40}}>DEBUG: Token not found in DB for token: {tokenValue}</div>;
  }
  if (String(tokenRow.video_id) !== String(videoId)) {
    return <div style={{color: 'red', padding: 40}}>DEBUG: videoId mismatch. tokenRow.video_id: {tokenRow.video_id}, URL videoId: {videoId}</div>;
  }
  if (Date.now() > new Date(tokenRow.expiresAt).getTime()) {
    return <div style={{color: 'red', padding: 40}}>DEBUG: Token expired. expiresAt: {tokenRow.expiresAt}, now: {new Date().toISOString()}</div>;
  }

  // 2) Fetch video metadata:
  const { data: video } = await supabaseAdmin
    .from('CollectionVideo')
    .select('*')
    .eq('id', Number(videoId))
    .single();

  if (!video) {
    return <div style={{color: 'red', padding: 40}}>DEBUG: Video not found in CollectionVideo for id: {videoId}</div>;
  }

  // 3) Generate a signed URL to stream the file:
  const { data: signed } = await supabaseAdmin.storage.from('videos').createSignedUrl(video.videoPath, 3600);
  if (!signed?.signedUrl) {
    return <div style={{color: 'red', padding: 40}}>DEBUG: Failed to generate signed URL for videoPath: {video.videoPath}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1>{video.title}</h1>
      <video controls width="100%" src={signed.signedUrl} />
    </div>
  );
} 