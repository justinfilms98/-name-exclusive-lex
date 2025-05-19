"use client";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AdminCollectionVideosPage from './CollectionVideosPage';

export default function PageWithBoundary() {
  return (
    <ErrorBoundary>
      <AdminCollectionVideosPage />
    </ErrorBoundary>
  );
} 