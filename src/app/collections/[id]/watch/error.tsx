"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error in dev only
    if (process.env.NODE_ENV !== 'production') {
      console.error('Watch page error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center text-white max-w-md p-8">
        <div className="text-red-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Something Went Wrong</h2>
        <p className="text-gray-300 mb-6">
          {error.message || 'An unexpected error occurred while loading the content.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-white text-black px-6 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.back()}
            className="w-full bg-gray-700 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

