'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PurchaseLegalDisclaimerProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function PurchaseLegalDisclaimer({ onAccept, onDecline }: PurchaseLegalDisclaimerProps) {
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadDMCA, setHasReadDMCA] = useState(false);
  const [hasReadMonitoring, setHasReadMonitoring] = useState(false);
  const router = useRouter();

  const allAccepted = hasReadTerms && hasReadDMCA && hasReadMonitoring;

  const handleAccept = () => {
    // Store acceptance for this specific purchase session
    localStorage.setItem('exclusive-lex-purchase-terms-accepted', 'true');
    onAccept();
  };

  const handleDecline = () => {
    // Clear any purchase-related data
    localStorage.removeItem('exclusive-lex-purchase-terms-accepted');
    onDecline();
    // Redirect back to collections
    router.push('/collections');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-red-50 to-white rounded-xl max-w-4xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl border-2 border-red-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-red-700 mb-2">
            ⚠️ PURCHASE LEGAL NOTICE
          </h1>
          <p className="text-gray-600 text-lg">
            Content Protection Agreement Required Before Viewing
          </p>
        </div>

        <div className="space-y-6">
          {/* Terms and Conditions */}
          <div className="border-2 border-red-200 rounded-lg p-6 bg-white shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 font-bold text-sm">1</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                TERMS AND CONDITIONS OF USE
              </h2>
            </div>
            <div className="text-sm text-gray-700 space-y-3 max-h-40 overflow-y-auto pr-2">
              <p><strong className="text-red-600">1.1 Content Ownership:</strong> All content on this platform is the exclusive property of Exclusive Lex and is protected by copyright laws.</p>
              <p><strong className="text-red-600">1.2 Prohibited Activities:</strong> Users are strictly prohibited from:</p>
              <ul className="list-disc ml-6 space-y-1 text-red-700">
                <li>Downloading, copying, or reproducing any content</li>
                <li>Screen recording or capturing content in any form</li>
                <li>Sharing, distributing, or transmitting content to third parties</li>
                <li>Reverse engineering or attempting to bypass security measures</li>
                <li>Using content for commercial purposes without explicit permission</li>
              </ul>
              <p><strong className="text-red-600">1.3 Legal Consequences:</strong> Violation of these terms will result in immediate legal action, including but not limited to civil lawsuits, criminal charges, and statutory damages of up to $150,000 per violation under the Digital Millennium Copyright Act (DMCA).</p>
              <p><strong className="text-red-600">1.4 Monitoring:</strong> By accessing this content, you acknowledge that your activity may be monitored for compliance with these terms.</p>
            </div>
            <label className="flex items-center mt-4 p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={hasReadTerms}
                onChange={(e) => setHasReadTerms(e.target.checked)}
                className="w-6 h-6 text-red-600 border-2 border-red-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700 ml-3">
                {hasReadTerms ? '✓ ' : '☐ '}I have read and understand the Terms and Conditions
              </span>
            </label>
          </div>

          {/* DMCA Notice */}
          <div className="border-2 border-red-200 rounded-lg p-6 bg-white shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 font-bold text-sm">2</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                DMCA COPYRIGHT PROTECTION NOTICE
              </h2>
            </div>
            <div className="text-sm text-gray-700 space-y-3 max-h-40 overflow-y-auto pr-2">
              <p><strong className="text-red-600">2.1 Copyright Protection:</strong> This content is protected under the Digital Millennium Copyright Act (DMCA) and international copyright laws.</p>
              <p><strong className="text-red-600">2.2 Statutory Damages:</strong> Unauthorized reproduction or distribution of this content may result in statutory damages of up to $150,000 per violation, plus attorney's fees and court costs.</p>
              <p><strong className="text-red-600">2.3 Criminal Penalties:</strong> Willful copyright infringement may result in criminal penalties including fines and imprisonment.</p>
              <p><strong className="text-red-600">2.4 Reporting:</strong> Any unauthorized use of this content should be reported immediately to our legal team for swift action.</p>
              <p><strong className="text-red-600">2.5 International Enforcement:</strong> Copyright protection extends internationally, and violations will be pursued in all applicable jurisdictions.</p>
            </div>
            <label className="flex items-center mt-4 p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={hasReadDMCA}
                onChange={(e) => setHasReadDMCA(e.target.checked)}
                className="w-6 h-6 text-red-600 border-2 border-red-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700 ml-3">
                {hasReadDMCA ? '✓ ' : '☐ '}I understand the DMCA copyright protection notice
              </span>
            </label>
          </div>

          {/* Monitoring Notice */}
          <div className="border-2 border-red-200 rounded-lg p-6 bg-white shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 font-bold text-sm">3</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                ACTIVITY MONITORING AND LEGAL ENFORCEMENT
              </h2>
            </div>
            <div className="text-sm text-gray-700 space-y-3 max-h-40 overflow-y-auto pr-2">
              <p><strong className="text-red-600">3.1 Active Monitoring:</strong> Your access to this content is actively monitored for compliance with our terms of service and copyright protection measures.</p>
              <p><strong className="text-red-600">3.2 Legal Action:</strong> Any detected violation of these terms will result in immediate legal action, including:</p>
              <ul className="list-disc ml-6 space-y-1 text-red-700">
                <li>Civil lawsuits for copyright infringement</li>
                <li>Criminal charges where applicable</li>
                <li>Statutory damages up to $150,000 per violation</li>
                <li>Attorney's fees and court costs</li>
                <li>Injunctions to prevent further violations</li>
              </ul>
              <p><strong className="text-red-600">3.3 Evidence Collection:</strong> All user activity is logged and may be used as evidence in legal proceedings.</p>
              <p><strong className="text-red-600">3.4 No Tolerance Policy:</strong> We maintain a zero-tolerance policy for copyright violations and will pursue all available legal remedies.</p>
            </div>
            <label className="flex items-center mt-4 p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={hasReadMonitoring}
                onChange={(e) => setHasReadMonitoring(e.target.checked)}
                className="w-6 h-6 text-red-600 border-2 border-red-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700 ml-3">
                {hasReadMonitoring ? '✓ ' : '☐ '}I understand that my activity is monitored and violations will result in legal action
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-6 mt-8 pt-6 border-t-2 border-red-200">
          <button
            onClick={handleDecline}
            className="px-8 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🚫 DECLINE - RETURN TO COLLECTIONS
          </button>
          <button
            onClick={handleAccept}
            disabled={!allAccepted}
            className={`px-8 py-4 rounded-lg transition-all duration-200 font-semibold text-lg shadow-lg transform ${
              allAccepted
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
            }`}
          >
            {allAccepted ? '✅ ACCEPT & START WATCHING' : '⏳ PLEASE CHECK ALL BOXES'}
          </button>
        </div>

        <div className="text-center mt-6 text-sm text-gray-600 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <strong>⚠️ IMPORTANT:</strong> By clicking "ACCEPT & START WATCHING", you acknowledge that you have read, understood, and agree to all terms and conditions above. This is a legally binding agreement required before viewing your purchased content.
        </div>
      </div>
    </div>
  );
} 