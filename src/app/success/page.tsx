// =====================================================
// SUCCESS PAGE
// Handles post-purchase flow and content access
// =====================================================

import { Suspense } from 'react';
import SuccessClient from './SuccessClient';

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessClient />
    </Suspense>
  );
} 