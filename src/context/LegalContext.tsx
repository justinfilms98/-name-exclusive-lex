'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface LegalContextType {
  hasAcceptedTerms: boolean;
  showDisclaimer: boolean;
  acceptTerms: () => void;
  declineTerms: () => void;
  setShowDisclaimer: (show: boolean) => void;
}

const LegalContext = createContext<LegalContextType | undefined>(undefined);

export function LegalProvider({ children }: { children: ReactNode }) {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const acceptTerms = () => {
    setHasAcceptedTerms(true);
    setShowDisclaimer(false);
    // Store in localStorage for persistence
    localStorage.setItem('exclusive-lex-terms-accepted', 'true');
  };

  const declineTerms = () => {
    setHasAcceptedTerms(false);
    setShowDisclaimer(false);
    // Redirect to external site or close window
    window.location.href = 'https://google.com';
  };

  return (
    <LegalContext.Provider value={{
      hasAcceptedTerms,
      showDisclaimer,
      acceptTerms,
      declineTerms,
      setShowDisclaimer
    }}>
      {children}
    </LegalContext.Provider>
  );
}

export function useLegal() {
  const context = useContext(LegalContext);
  if (context === undefined) {
    throw new Error('useLegal must be used within a LegalProvider');
  }
  return context;
} 