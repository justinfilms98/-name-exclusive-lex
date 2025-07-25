'use client';

import { useEffect } from 'react';
import { useLegal } from '../context/LegalContext';
import LegalDisclaimer from './LegalDisclaimer';

export default function LegalDisclaimerWrapper() {
  const { hasAcceptedTerms, showDisclaimer, setShowDisclaimer, acceptTerms, declineTerms } = useLegal();

  useEffect(() => {
    // Check if user has already accepted terms
    const hasAccepted = localStorage.getItem('exclusive-lex-terms-accepted') === 'true';
    
    if (!hasAccepted && !showDisclaimer) {
      setShowDisclaimer(true);
    }
  }, [hasAcceptedTerms, showDisclaimer, setShowDisclaimer]);

  if (!showDisclaimer) {
    return null;
  }

  return (
    <LegalDisclaimer
      onAccept={acceptTerms}
      onDecline={declineTerms}
    />
  );
} 