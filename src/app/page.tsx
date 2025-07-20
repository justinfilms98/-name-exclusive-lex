"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import HeroSection from '@/components/HeroSection';
import Link from 'next/link';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    loadData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-sand">
      {/* Hero Section */}
      <HeroSection />

      {/* Minimal CTA for signed-in users only */}
      {!loading && user && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30">
          <Link
            href="/collections"
            className="btn-primary px-8 py-3 rounded-full font-medium text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            View Collections
          </Link>
        </div>
      )}
    </div>
  );
} 