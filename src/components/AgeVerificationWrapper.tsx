"use client";

import { useState } from 'react';
import AgeVerification from './AgeVerification';

interface AgeVerificationWrapperProps {
  children: React.ReactNode;
}

export default function AgeVerificationWrapper({ children }: AgeVerificationWrapperProps) {
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  if (!isAgeVerified) {
    return <AgeVerification onVerified={() => setIsAgeVerified(true)} />;
  }

  return <>{children}</>;
} 