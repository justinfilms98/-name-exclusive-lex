import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface CollectionVideo {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  thumbnail_url: string;
  video_url: string;
}

export default function CollectionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<CollectionVideo[]>([]);
  const [cart, setCart] = useState<CollectionVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();
  }, [supabase]);

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    setVideosLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/collection-videos');
      const data = await res.json();
      if (res.ok) setVideos(data);
      else setError(data.error || 'Failed to fetch videos');
    } catch (err) {
      setError('Failed to fetch videos');
    } finally {
      setVideosLoading(false);
    }
  }

  function addToCart(video: CollectionVideo) {
    setCart(prev => [...prev, video]);
  }

  function buyNow(video: CollectionVideo) {
    setCart([video]);
    // Optionally, auto-trigger checkout here
  }

  async function handleCheckout() {
    if (!user?.email) {
      setError('You must be logged in to checkout.');
      return;
    }
    setCheckoutLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoIds: cart.map(v => v.id),
          userEmail: user.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session');
      setCart([]);
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  }

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-brand-mist py-8 px-4">
      <h2 className="text-3xl font-serif text-brand-pine mb-4">Collections</h2>
      {videosLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {user ? (
        <p className="mb-4">Logged in as <b>{user.email}</b></p>
      ) : (
        <button className="bg-brand-tan text-white px-4 py-2 rounded hover:bg-brand-earth transition" onClick={handleSignIn}>Sign in with Google</button>
      )}
      <div className="flex flex-wrap gap-6 mt-6">
        {videos.map((video) => (
          <div key={video.id} className="bg-brand-almond rounded-lg shadow p-4 w-72 flex flex-col items-center">
            <img src={video.thumbnail_url} alt={video.title} className="w-full h-32 object-cover rounded mb-3" />
            <h3 className="text-lg font-serif text-brand-pine mb-1">{video.title}</h3>
            <p className="text-brand-earth text-sm mb-2">{video.description}</p>
            <p className="text-brand-tan font-bold mb-2">${video.price}</p>
            <div className="flex gap-2 mt-auto">
              <button className="bg-brand-tan text-white px-3 py-1 rounded hover:bg-brand-earth transition" onClick={() => addToCart(video)}>Add to Cart</button>
              <button className="bg-brand-sage text-white px-3 py-1 rounded hover:bg-brand-earth transition" onClick={() => buyNow(video)}>Buy Now</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <h3 className="text-xl font-serif text-brand-pine mb-2">Cart</h3>
        {cart.length === 0 && <p className="text-brand-earth">No items in cart.</p>}
        {cart.map((item, idx) => (
          <div key={item.id + idx} className="flex items-center gap-2 text-brand-pine">
            <span>{item.title} - ${item.price}</span>
          </div>
        ))}
        {cart.length > 0 && user && (
          <div className="mt-4">
            <button className="bg-brand-tan text-white px-4 py-2 rounded hover:bg-brand-earth transition" onClick={handleCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? 'Redirecting...' : 'Checkout'}
            </button>
          </div>
        )}
        {cart.length > 0 && !user && (
          <div className="mt-4">
            <button className="bg-brand-tan text-white px-4 py-2 rounded hover:bg-brand-earth transition" onClick={handleSignIn}>Sign in to Checkout</button>
          </div>
        )}
      </div>
    </div>
  );
} 