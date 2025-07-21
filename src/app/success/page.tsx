"use client";

import { Suspense } from 'react';
import SuccessClient from './SuccessClient';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lex-sand via-lex-cream to-lex-warmGray">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 spinner mx-auto mb-4"></div>
            <p className="text-lex-brown text-lg">Processing your purchase...</p>
          </div>
        </div>
      }>
        <SuccessClient />
      </Suspense>
    </div>
  );
} 