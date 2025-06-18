import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

interface PageProps {
  params: { videoId: string };
  searchParams: { token?: string };
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VideoPlayer = dynamic(() => import('./VideoPlayer'), { ssr: false });

export default async function WatchPage({ params, searchParams }: PageProps) {
  let debug = '';
  try {
    const videoId = params.videoId;
    const tokenValue = searchParams.token;
    debug += `videoId: ${videoId} | tokenValue: ${tokenValue}\n`;
    if (!tokenValue) return (
      <div style={{ background: 'white', color: 'black', padding: 20 }}>
        <h1>DEBUG OUTPUT</h1>
        <pre>{debug} - No tokenValue</pre>
      </div>
    );

    // 1) Validate token
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('purchase_tokens')
      .select('user_id, video_id, expires_at')
      .eq('token', tokenValue)
      .single();
    debug += `tokenRow: ${JSON.stringify(tokenRow)} | tokenError: ${JSON.stringify(tokenError)}\n`;
    if (tokenError || !tokenRow) return (
      <div style={{ background: 'white', color: 'black', padding: 20 }}>
        <h1>DEBUG OUTPUT</h1>
        <pre>{debug} - Token not found or error</pre>
      </div>
    );
    if (
      String(tokenRow.video_id) != String(videoId) ||
      new Date(tokenRow.expires_at).getTime() < Date.now()
    ) {
      debug += `tokenRow.video_id: ${tokenRow.video_id} | tokenRow.expires_at: ${tokenRow.expires_at}\n`;
      return (
        <div style={{ background: 'white', color: 'black', padding: 20 }}>
          <h1>DEBUG OUTPUT</h1>
          <pre>{debug} - Token video_id mismatch or expired</pre>
        </div>
      );
    }

    // 2) Fetch video metadata
    const { data: video, error: videoError } = await supabaseAdmin
      .from('CollectionVideo')
      .select('id, title, videoUrl')
      .eq('id', Number(videoId))
      .single();
    debug += `video: ${JSON.stringify(video)} | videoError: ${JSON.stringify(videoError)}\n`;
    if (videoError || !video) return (
      <div style={{ background: 'white', color: 'black', padding: 20 }}>
        <h1>DEBUG OUTPUT</h1>
        <pre>{debug} - Video not found or error</pre>
      </div>
    );

    // 3) Create signed URL
    const { data: signedData, error: signedError } = await supabaseAdmin
      .storage
      .from('videos') // replace with your actual bucket name if different
      .createSignedUrl(video.videoUrl, 60 * 60);
    debug += `signedData: ${JSON.stringify(signedData)} | signedError: ${JSON.stringify(signedError)}\n`;
    if (signedError || !signedData?.signedUrl) return (
      <div style={{ background: 'white', color: 'black', padding: 20 }}>
        <h1>DEBUG OUTPUT</h1>
        <pre>{debug} - Signed URL error</pre>
      </div>
    );
    const videoUrl = signedData.signedUrl;

    // 4) Render video player (client component)
    return <VideoPlayer src={videoUrl} title={video.title} />;
  } catch (err) {
    debug += `CATCH ERROR: ${err instanceof Error ? err.message : String(err)}\n`;
    return (
      <div style={{ background: 'white', color: 'black', padding: 20 }}>
        <h1>DEBUG OUTPUT</h1>
        <pre>{debug}</pre>
      </div>
    );
  }
} 