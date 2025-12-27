'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h2>Something went wrong loading this page.</h2>
        <p>Please refresh. If it continues, try a private window.</p>
        <button
          onClick={() => reset()}
          style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

