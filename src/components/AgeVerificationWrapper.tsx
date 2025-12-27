"use client";

import { useState, useEffect } from 'react';
import AgeVerification from './AgeVerification';

interface AgeVerificationWrapperProps {
  children: React.ReactNode;
}

export default function AgeVerificationWrapper({ children }: AgeVerificationWrapperProps) {
  const [isAgeVerified, setIsAgeVerified] = useState<boolean | null>(null);

  useEffect(() => {
    // Check localStorage in useEffect to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      const verified = localStorage.getItem('age-verified');
      setIsAgeVerified(verified === 'true');
    }
  }, []);

  const handleVerified = () => {
    setIsAgeVerified(true);
  };

  // Show nothing while checking (prevents flash of age verification)
  if (isAgeVerified === null) {
    return null;
  }

  if (!isAgeVerified) {
    return <AgeVerification onVerified={handleVerified} />;
  }

  return <>{children}</>;
} 