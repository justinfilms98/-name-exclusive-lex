"use client";

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface AgeVerificationProps {
  onVerified: () => void;
}

export default function AgeVerification({ onVerified }: AgeVerificationProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Check if user has already verified age
    const verified = localStorage.getItem('age-verified');
    if (verified === 'true') {
      setIsVerified(true);
      onVerified();
    }
  }, [onVerified]);

  const handleVerify = (isAdult: boolean) => {
    if (isAdult) {
      localStorage.setItem('age-verified', 'true');
      setIsVerified(true);
      onVerified();
    } else {
      setShowWarning(true);
    }
  };

  if (isVerified) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Age Verification Required</h1>
          <p className="text-gray-600">You must be 18 or older to access this content</p>
        </div>

        {!showWarning ? (
          <>
            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 mb-1">Adult Content Warning</h3>
                  <p className="text-sm text-yellow-700">
                    This website contains adult content intended for viewers 18 years and older. 
                    By proceeding, you confirm that you are at least 18 years of age.
                  </p>
                </div>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Legal Notice</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                By accessing this content, you acknowledge that you are at least 18 years old and 
                that you are accessing this material in compliance with all applicable laws. 
                This content is protected by copyright and unauthorized distribution is prohibited.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleVerify(true)}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                I am 18 or older
              </button>
              
              <button
                onClick={() => handleVerify(false)}
                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                I am under 18
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Under Age Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 mb-1">Access Denied</h3>
                  <p className="text-sm text-red-700">
                    You must be 18 or older to access this content. Please return when you are of legal age.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.location.href = 'https://www.google.com'}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Exit Site
            </button>
          </>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By using this site, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
} 