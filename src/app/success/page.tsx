"use client";

import { Suspense } from 'react';
import SuccessClient from './SuccessClient';

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    }>
      <SuccessClient />
    </Suspense>
  );
} 