'use client';
import { useRouter } from 'next/navigation';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function SignInPage() {
  const supabase = useSupabaseClient();
  const router = useRouter();

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      alert('Login failed: ' + error.message);
    }
    // Supabase will redirect automatically to /api/auth/callback
  };

  return (
    <button onClick={handleGoogle}>
      Sign in with Google
    </button>
  );
} 