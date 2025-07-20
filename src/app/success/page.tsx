"use client";

import { Suspense } from 'react';
import SuccessClient from './SuccessClient';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-sand pt-20">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-pearl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-salmon mx-auto mb-4"></div>
            <p className="text-green">Loading purchase confirmation...</p>
          </div>
        </div>
      }>
        <SuccessClient />
      </Suspense>
    </div>
  );
} 