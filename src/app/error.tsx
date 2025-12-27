"use client";

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error('App Router Error:', error);
    
    // Send to error logging endpoint if available
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href,
            type: 'error-boundary',
          }),
        }).catch(() => {
          // Silently fail if endpoint is unavailable
        });
      } catch (e) {
        // Silently fail
      }
    }
  }, [error]);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html>
      <body style={{ padding: 24, fontFamily: 'system-ui' }}>
        <div className="min-h-screen bg-gradient-to-br from-almond to-blanc flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-serif text-earth mb-4">Something went wrong loading this page.</h2>
            <p className="text-earth mb-8 opacity-75">
              Please refresh. If it continues, try a private window.
            </p>

            {isDev && error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-red-800 mb-2">Error Details (Dev Only):</p>
                <p className="text-xs text-red-700 font-mono break-all mb-2">{error.message}</p>
                {error.stack && (
                  <pre className="text-xs text-red-600 overflow-auto max-h-40 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => reset()}
                style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}
                className="w-full bg-earth text-white px-6 py-3 rounded-lg hover:bg-khaki transition-all duration-200 font-semibold shadow-lg"
              >
                Try again
              </button>
              
              <Link
                href="/"
                className="block w-full bg-blanc text-earth px-6 py-3 rounded-lg hover:bg-blanket transition-all duration-200 font-semibold border-2 border-earth"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

