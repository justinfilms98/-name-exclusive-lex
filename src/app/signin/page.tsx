'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export default function SignInPage() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const user = useUser();
  const [loading, setLoading] = useState(false);

  // If already logged in, send them home/account
  useEffect(() => {
    if (user) {
      router.replace('/account');
    }
  }, [user, router]);

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/account` }
    });
    if (error) {
      console.error('OAuth error:', error);
      alert('Login failed: ' + error.message);
      setLoading(false);
    }
    // On success, Supabase will redirect to /account
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#f5f1eb'
    }}>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Sign in to Exclusive Lex</h1>
      <button
        onClick={handleGoogle}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: 16,
          background: '#654C37',
          color: '#fff',
          borderRadius: 8,
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1
        }}
      >
        {loading ? 'Redirecting…' : 'Sign in with Google'}
      </button>
    </div>
  );
} 