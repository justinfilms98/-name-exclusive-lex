import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function WatchVideoPage() {
  const router = useRouter();
  const { videoId } = router.query;
  const [email, setEmail] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAccess() {
    setLoading(true);
    setError('');
    setVideoUrl('');
    try {
      const res = await fetch(`/api/secure-video?videoId=${videoId}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Access denied');
      setVideoUrl(data.signedUrl);
    } catch (err: any) {
      setError(err.message || 'Access denied');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Watch Video</h2>
      <input
        type="email"
        placeholder="Enter your email to access"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ marginRight: 8 }}
      />
      <button onClick={handleAccess} disabled={loading || !email}>
        {loading ? 'Checking...' : 'Access Video'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {videoUrl && (
        <div style={{ marginTop: 24 }}>
          <video src={videoUrl} controls style={{ width: 600 }} />
        </div>
      )}
    </div>
  );
} 