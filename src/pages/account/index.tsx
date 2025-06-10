import React, { useEffect, useState, useMemo } from 'react';
import { useUser } from '@supabase/auth-helpers-react';

interface Purchase {
  id: string;
  videoId: number;
  createdAt: string;
  expiresAt: string;
  video: {
    id: number;
    title: string;
    thumbnail: string;
    duration: number;
  };
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  const supabaseUser = useUser();

  useEffect(() => {
    async function fetchUser() {
      setUser(supabaseUser || null);
    }
    fetchUser();
  }, [supabaseUser]);

  useEffect(() => {
    if (user?.email) fetchPurchases();
  }, [user?.email]);

  async function fetchPurchases() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user-purchases?email=${encodeURIComponent(user?.email || '')}`);
      const data = await res.json();
      if (res.ok) setPurchases(data);
      else setError(data.error || 'Failed to fetch purchases');
    } catch (err) {
      setError('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  }

  const filteredPurchases = useMemo(() => {
    let list = purchases;
    if (filter === 'active') {
      list = list.filter(p => new Date() <= new Date(p.expiresAt));
    } else if (filter === 'expired') {
      list = list.filter(p => new Date() > new Date(p.expiresAt));
    }
    if (sort === 'newest') {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      list = [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return list;
  }, [purchases, filter, sort]);

  if (!user) return <button className="bg-brand-tan text-white px-4 py-2 rounded hover:bg-brand-earth transition" onClick={() => window.location.href = '/signin'}>Sign in to view your account</button>;

  return (
    <div className="min-h-screen bg-brand-mist py-8 px-4">
      <h2 className="text-3xl font-serif text-brand-pine mb-4">My Account</h2>
      <p className="mb-4">Logged in as <b>{user?.email}</b></p>
      <div className="flex flex-wrap gap-4 mb-6">
        <select value={filter} onChange={e => setFilter(e.target.value as any)} className="px-3 py-2 rounded border border-brand-tan bg-white text-brand-earth">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as any)} className="px-3 py-2 rounded border border-brand-tan bg-white text-brand-earth">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
      {loading && <p>Loading purchases...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {filteredPurchases.length === 0 && !loading && (
        <div className="text-center mt-12">
          <p className="text-brand-earth text-lg mb-4">No purchases yet. Ready to treat yourself?</p>
          <a href="/collections" className="inline-block bg-brand-tan text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-earth transition">Browse Collections</a>
        </div>
      )}
      <ul className="space-y-4 mt-6">
        {filteredPurchases.map((purchase) => {
          if (!purchase.expiresAt || !purchase.createdAt || !purchase.video) {
            return (
              <li key={purchase.id} className="bg-red-100 text-red-700 rounded p-4">
                Incomplete purchase data. Please contact support.
              </li>
            );
          }
          const expired = new Date() > new Date(purchase.expiresAt);
          // Calculate original access duration in days
          const durationDays = Math.round((new Date(purchase.expiresAt).getTime() - new Date(purchase.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          return (
            <li key={purchase.id} className="premium-card bg-brand-almond rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center gap-4 relative">
              <div className="relative group">
                <img
                  src={purchase.video?.thumbnail}
                  alt={purchase.video?.title || 'Video thumbnail'}
                  className="w-24 h-16 object-cover rounded mb-2 md:mb-0"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity">
                  <span className="text-white text-xl">▶</span>
                </div>
              </div>
              <div className="flex-1">
                <b className="text-lg text-brand-pine font-serif">{purchase.video?.title || 'Untitled Video'}</b><br />
                <span className="text-brand-earth text-sm">Duration: {purchase.video?.duration} min</span><br />
                <span className="text-brand-earth text-sm">Purchased: {new Date(purchase.createdAt).toLocaleString()}</span><br />
                <span className="text-brand-earth text-sm">Access: {durationDays} days</span><br />
              </div>
              <div>
                {expired ? (
                  <button className="inline-block bg-brand-tan text-white px-4 py-2 rounded mt-2 hover:bg-brand-earth transition">Renew</button>
                ) : (
                  <a
                    href={`/watch/${purchase.video?.id}?userId=${user?.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-brand-tan text-white px-4 py-2 rounded mt-2 hover:bg-brand-earth transition"
                  >
                    Watch
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
} 