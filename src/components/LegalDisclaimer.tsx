'use client';

import { useState } from 'react';

interface LegalDisclaimerProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function LegalDisclaimer({ onAccept, onDecline }: LegalDisclaimerProps) {
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadDMCA, setHasReadDMCA] = useState(false);
  const [hasReadMonitoring, setHasReadMonitoring] = useState(false);

  const allAccepted = hasReadTerms && hasReadDMCA && hasReadMonitoring;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-red-600">
          LEGAL NOTICE - CONTENT PROTECTION AGREEMENT
        </h1>

        <div className="space-y-6">
          {/* Terms and Conditions */}
          <div className="border border-gray-300 rounded p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              1. TERMS AND CONDITIONS OF USE
            </h2>
            <div className="text-sm text-gray-700 space-y-2 max-h-40 overflow-y-auto">
              <p><strong>1.1 Content Ownership:</strong> All content on this platform is the exclusive property of Exclusive Lex and is protected by copyright laws.</p>
              <p><strong>1.2 Prohibited Activities:</strong> Users are strictly prohibited from:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Downloading, copying, or reproducing any content</li>
                <li>Screen recording or capturing content in any form</li>
                <li>Sharing, distributing, or transmitting content to third parties</li>
                <li>Reverse engineering or attempting to bypass security measures</li>
                <li>Using content for commercial purposes without explicit permission</li>
              </ul>
              <p><strong>1.3 Legal Consequences:</strong> Violation of these terms will result in immediate legal action, including but not limited to civil lawsuits, criminal charges, and statutory damages of up to $150,000 per violation under the Digital Millennium Copyright Act (DMCA).</p>
              <p><strong>1.4 Monitoring:</strong> By accessing this content, you acknowledge that your activity may be monitored for compliance with these terms.</p>
            </div>
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={hasReadTerms}
                onChange={(e) => setHasReadTerms(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">I have read and understand the Terms and Conditions</span>
            </label>
          </div>

          {/* DMCA Notice */}
          <div className="border border-gray-300 rounded p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              2. DMCA COPYRIGHT PROTECTION NOTICE
            </h2>
            <div className="text-sm text-gray-700 space-y-2 max-h-40 overflow-y-auto">
              <p><strong>2.1 Copyright Protection:</strong> This content is protected under the Digital Millennium Copyright Act (DMCA) and international copyright laws.</p>
              <p><strong>2.2 Statutory Damages:</strong> Unauthorized reproduction or distribution of this content may result in statutory damages of up to $150,000 per violation, plus attorney's fees and court costs.</p>
              <p><strong>2.3 Criminal Penalties:</strong> Willful copyright infringement may result in criminal penalties including fines and imprisonment.</p>
              <p><strong>2.4 Reporting:</strong> Any unauthorized use of this content should be reported immediately to our legal team for swift action.</p>
              <p><strong>2.5 International Enforcement:</strong> Copyright protection extends internationally, and violations will be pursued in all applicable jurisdictions.</p>
            </div>
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={hasReadDMCA}
                onChange={(e) => setHasReadDMCA(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">I understand the DMCA copyright protection notice</span>
            </label>
          </div>

          {/* Monitoring Notice */}
          <div className="border border-gray-300 rounded p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              3. ACTIVITY MONITORING AND LEGAL ENFORCEMENT
            </h2>
            <div className="text-sm text-gray-700 space-y-2 max-h-40 overflow-y-auto">
              <p><strong>3.1 Active Monitoring:</strong> Your access to this content is actively monitored for compliance with our terms of service and copyright protection measures.</p>
              <p><strong>3.2 Legal Action:</strong> Any detected violation of these terms will result in immediate legal action, including:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Civil lawsuits for copyright infringement</li>
                <li>Criminal charges where applicable</li>
                <li>Statutory damages up to $150,000 per violation</li>
                <li>Attorney's fees and court costs</li>
                <li>Injunctions to prevent further violations</li>
              </ul>
              <p><strong>3.3 Evidence Collection:</strong> All user activity is logged and may be used as evidence in legal proceedings.</p>
              <p><strong>3.4 No Tolerance Policy:</strong> We maintain a zero-tolerance policy for copyright violations and will pursue all available legal remedies.</p>
            </div>
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={hasReadMonitoring}
                onChange={(e) => setHasReadMonitoring(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">I understand that my activity is monitored and violations will result in legal action</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-6 pt-4 border-t">
          <button
            onClick={onDecline}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            DECLINE - EXIT SITE
          </button>
          <button
            onClick={onAccept}
            disabled={!allAccepted}
            className={`px-6 py-2 rounded transition-colors ${
              allAccepted
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            ACCEPT & CONTINUE
          </button>
        </div>

        <div className="text-center mt-4 text-xs text-gray-500">
          By clicking "ACCEPT & CONTINUE", you acknowledge that you have read, understood, and agree to all terms and conditions above.
        </div>
      </div>
    </div>
  );
} 