import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function Page({ params, searchParams }: { params: { videoId: string }, searchParams?: { token?: string } }) {
  let debug = '';
  try {
    const videoId = params.videoId;
    const tokenValue = searchParams?.token;
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
    const videoPath = video.videoUrl.split('/').pop();
    const { data: signedData, error: signedError } = await supabaseAdmin
      .storage
      .from('videos') // replace with your actual bucket name if different
      .createSignedUrl(videoPath, 60 * 60);
    debug += `signedData: ${JSON.stringify(signedData)} | signedError: ${JSON.stringify(signedError)}\n`;
    if (signedError || !signedData?.signedUrl) return (
      <div style={{ background: 'white', color: 'black', padding: 20 }}>
        <h1>DEBUG OUTPUT</h1>
        <pre>{debug} - Signed URL error</pre>
      </div>
    );
    const videoUrl = signedData.signedUrl;

    // 4) Render video player (no debug, fullscreen)
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#D4C7B4' }}>
        <h1 className="text-3xl font-bold mb-6 text-center text-[#654C37]">{video.title}</h1>
        <video
          controls
          style={{ width: '100vw', height: '80vh', objectFit: 'contain', background: 'black' }}
          src={videoUrl}
          className="rounded-lg shadow-lg"
        />
      </div>
    );
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