"use client";

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function NotEligiblePage() {
  return (
    <div className="min-h-screen bg-brand-mist flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card-glass p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-serif tracking-wide text-brand-pine mb-4">
            Access Denied
          </h1>

          {/* Message */}
          <p className="text-base text-brand-earth mb-6 leading-relaxed">
            You must be 18 or older to access this content. Please return when you are of legal age.
          </p>

          {/* Warning Box */}
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

          {/* Exit Button */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = 'https://www.google.com';
              }
            }}
            className="w-full bg-brand-almond hover:bg-brand-sage/20 text-brand-pine rounded-2xl px-5 py-3 font-medium transition-colors"
          >
            Exit Site
          </button>
        </div>
      </div>
    </div>
  );
}
