"use client";

import SuccessClient from './SuccessClient';
import ClientErrorBoundary from '@/components/ClientErrorBoundary';

export default function SuccessPage() {
  return (
    <ClientErrorBoundary>
      <SuccessClient />
    </ClientErrorBoundary>
  );
} 