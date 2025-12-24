"use client";

import React from 'react';
import Link from 'next/link';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ClientErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ClientErrorBoundary caught an error:', error, errorInfo);
    
    // Log to error endpoint
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
            componentStack: errorInfo.componentStack,
          }),
        }).catch(() => {
          // Silently fail
        });
      } catch (e) {
        // Silently fail
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-almond to-blanc flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-serif text-lex-brown mb-4">Something went wrong</h1>
            <p className="text-lex-brown mb-8 opacity-75">
              We encountered an issue loading this content. Please try refreshing or return to the homepage.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full bg-lex-brown text-white px-6 py-3 rounded-lg hover:bg-lex-warmGray transition-all duration-200 font-semibold shadow-lg"
              >
                Reload Page
              </button>
              
              <Link
                href="/"
                className="block w-full bg-white text-lex-brown px-6 py-3 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold border-2 border-lex-brown"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ClientErrorBoundary;

