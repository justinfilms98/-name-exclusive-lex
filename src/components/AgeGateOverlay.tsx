"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, AlertTriangle } from 'lucide-react';

export default function AgeGateOverlay() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check localStorage in useEffect to avoid hydration mismatch
    try {
      if (typeof window !== 'undefined') {
        const verified = localStorage.getItem('exclusivelex_age_verified');
        setIsVerified(verified === 'true');
        // Small delay for smooth entrance animation
        setTimeout(() => setMounted(true), 10);
      }
    } catch (error) {
      console.error('[AgeGateOverlay] Error checking localStorage:', error);
      // If localStorage fails, assume not verified (safest default)
      setIsVerified(false);
      setMounted(true);
    }
  }, []);

  const handleVerify = (isAdult: boolean) => {
    try {
      if (typeof window !== 'undefined') {
        if (isAdult) {
          localStorage.setItem('exclusivelex_age_verified', 'true');
          setIsVerified(true);
        } else {
          // Redirect to /not-eligible immediately on decline
          window.location.href = '/not-eligible';
        }
      }
    } catch (error) {
      console.error('[AgeGateOverlay] Error setting localStorage:', error);
    }
  };

  // Don't render anything until we've checked (prevents flash)
  if (isVerified === null) {
    return null;
  }

  // If verified, don't show overlay
  if (isVerified) {
    return null;
  }

  return (
    <>
      {/* Luxury Backdrop with Blur and Vignette */}
      <div 
        className={`fixed inset-0 z-[9999] bg-black/50 backdrop-blur-md transition-opacity duration-200 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Vignette gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
      </div>

      {/* Premium Card Container */}
      <div 
        className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-200 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="w-[92%] max-w-md max-h-[85vh] overflow-auto rounded-3xl shadow-2xl bg-[#F8F6F1] border border-[#D4C7B4] p-6 sm:p-8">
          {!showWarning ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif tracking-wide text-[#654C37] mb-2">
                  Age Verification Required
                </h1>
                <p className="text-sm uppercase tracking-[0.2em] text-[#2B2B2B]/70">
                  You must be 18 or older to access this content
                </p>
              </div>

              {/* Warning Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 mb-1">Adult Content Warning</h3>
                    <p className="text-sm text-yellow-700 leading-relaxed">
                      This website contains adult content intended for viewers 18 years and older. 
                      By proceeding, you confirm that you are at least 18 years of age.
                    </p>
                  </div>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="bg-[#F2E0CF]/50 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-medium text-[#654C37] mb-2">Legal Notice</h3>
                <p className="text-xs text-[#2B2B2B]/80 leading-relaxed">
                  By accessing this content, you acknowledge that you are at least 18 years old and 
                  that you are accessing this material in compliance with all applicable laws. 
                  This content is protected by copyright and unauthorized distribution is prohibited.
                </p>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-[#D4C7B4]/70 my-4" />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <button
                  onClick={() => handleVerify(true)}
                  className="w-full sm:flex-1 bg-[#8F907E] hover:bg-[#7f8070] text-white rounded-2xl px-5 py-3 font-medium shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F907E] focus-visible:ring-offset-2"
                >
                  I am 18 or older
                </button>
                
                <button
                  onClick={() => handleVerify(false)}
                  className="w-full sm:flex-1 bg-[#F2E0CF] hover:bg-[#D4C7B4] text-[#654C37] rounded-2xl px-5 py-3 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F907E] focus-visible:ring-offset-2"
                >
                  I am under 18
                </button>
              </div>

              {/* Footer */}
              <p className="text-xs text-[#2B2B2B]/60 text-center leading-relaxed">
                By entering, you agree to our{' '}
                <Link href="/terms" className="underline underline-offset-4 hover:text-[#654C37] transition-colors">
                  Terms
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-[#654C37] transition-colors">
                  Privacy
                </Link>
                .
              </p>
            </>
          ) : (
            <>
              {/* Under Age Warning */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif tracking-wide text-[#654C37] mb-2">
                  Access Denied
                </h1>
                <p className="text-base text-[#2B2B2B]/80 leading-relaxed">
                  You must be 18 or older to access this content. Please return when you are of legal age.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800 mb-1">Age Restriction</h3>
                    <p className="text-sm text-red-700 leading-relaxed">
                      This website is restricted to users who are 18 years of age or older.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  try {
                    if (typeof window !== 'undefined') {
                      window.location.href = '/not-eligible';
                    }
                  } catch (error) {
                    console.error('[AgeGateOverlay] Error redirecting:', error);
                  }
                }}
                className="w-full bg-[#F2E0CF] hover:bg-[#D4C7B4] text-[#654C37] rounded-2xl px-5 py-3 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F907E] focus-visible:ring-offset-2"
              >
                Exit Site
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
