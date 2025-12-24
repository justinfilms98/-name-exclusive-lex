"use client";

import { useEffect } from 'react';

export default function ClientErrorHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const logError = async (error: ErrorEvent | PromiseRejectionEvent, type: 'error' | 'unhandledrejection') => {
      const errorData = {
        message: type === 'error' 
          ? (error as ErrorEvent).message || 'Unknown error'
          : (error as PromiseRejectionEvent).reason?.message || String((error as PromiseRejectionEvent).reason) || 'Unhandled promise rejection',
        stack: type === 'error'
          ? (error as ErrorEvent).error?.stack
          : (error as PromiseRejectionEvent).reason?.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        type,
      };

      // Log to console
      console.error(`[${type.toUpperCase()}]`, errorData);

      // Send to error logging endpoint
      try {
        await fetch('/api/client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
        });
      } catch (e) {
        // Silently fail if endpoint is unavailable
        console.warn('Failed to log error to server:', e);
      }
    };

    const handleError = (event: ErrorEvent) => {
      logError(event, 'error');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError(event, 'unhandledrejection');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}

