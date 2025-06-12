"use client";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/Toast';
import CollectionMediaPage from './CollectionMediaPage';

export default function PageWithBoundary() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <CollectionMediaPage />
      </ToastProvider>
    </ErrorBoundary>
  );
} 