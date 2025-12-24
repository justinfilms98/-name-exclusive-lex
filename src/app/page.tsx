"use client";

import HeroSection from '@/components/HeroSection';
import ClientErrorBoundary from '@/components/ClientErrorBoundary';

export default function HomePage() {
  return (
    <ClientErrorBoundary>
      <div className="min-h-screen bg-almond -mt-14 sm:-mt-16">
        <HeroSection />
      </div>
    </ClientErrorBoundary>
  );
} 