'use client';
export const dynamic = 'force-dynamic';
import HeroSection from '@/components/HeroSection';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  return (
    <div>
      <HeroSection />
      {status !== 'loading' && !session && (
        <div className="flex justify-center mt-8">
          <Link href="/login" className="bg-stone-800 text-white px-6 py-3 rounded-md font-semibold hover:bg-stone-900 transition-colors">
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
} 