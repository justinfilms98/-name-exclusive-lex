import React, { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';

interface Purchase {
  id: string;
  video_id: string;
  purchased_at: string;
  expires_at: string;
  video: { title: string };
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) fetchPurchases();
  }, [session?.user?.email]);

  async function fetchPurchases() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user-purchases?email=${encodeURIComponent(session?.user?.email || '')}`);
      const data = await res.json();
      if (res.ok) setPurchases(data);
      else setError(data.error || 'Failed to fetch purchases');
    } catch (err) {
      setError('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return <button className="bg-brand-tan text-white px-4 py-2 rounded hover:bg-brand-earth transition" onClick={() => signIn('google')}>Sign in to view your account</button>;

  return (
    <div className="min-h-screen bg-brand-mist py-8 px-4">
      <h2 className="text-3xl font-serif text-brand-pine mb-4">My Account</h2>
      <p className="mb-4">Logged in as <b>{session.user?.email}</b></p>
      {loading && <p>Loading purchases...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {purchases.length === 0 && !loading && <p className="text-brand-earth">No purchases yet.</p>}
      <ul className="space-y-4 mt-6">
        {purchases.map((purchase) => {
          const expired = new Date() > new Date(purchase.expires_at);
          return (
            <li key={purchase.id} className="bg-brand-almond rounded-lg shadow p-4">
              <b className="text-lg text-brand-pine font-serif">{purchase.video?.title || 'Untitled Video'}</b><br />
              <span className="text-brand-earth text-sm">Purchased: {new Date(purchase.purchased_at).toLocaleString()}</span><br />
              <span className="text-brand-earth text-sm">Expires: {new Date(purchase.expires_at).toLocaleString()}</span><br />
              {expired ? (
                <span className="inline-block bg-brand-tan text-white px-2 py-1 rounded mt-2">Expired</span>
              ) : (
                <a href={`/collections/watch/${purchase.video_id}`} target="_blank" rel="noopener noreferrer" className="inline-block bg-brand-tan text-white px-4 py-2 rounded mt-2 hover:bg-brand-earth transition">Watch</a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
} 