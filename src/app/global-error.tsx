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
    console.error('[global-error]', error);
    if (error.digest) {
      console.error('[global-error] digest:', error.digest);
    }
    if (error.stack) {
      console.error('[global-error] stack:', error.stack);
    }
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - Exclusive Lex</title>
      </head>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#C9BBA8',
        color: '#654C37',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          padding: '32px',
          backgroundColor: '#F8F6F1',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            backgroundColor: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            ⚠️
          </div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: '#654C37'
          }}>
            Something went wrong
          </h1>
          <p style={{ 
            fontSize: '16px', 
            marginBottom: '32px',
            color: '#654C37',
            opacity: 0.8
          }}>
            We encountered an error loading this page. Please try refreshing.
          </p>
          <button
            onClick={() => reset()}
            style={{ 
              padding: '12px 24px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              backgroundColor: '#8F907E',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7C7458'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8F907E'}
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}

