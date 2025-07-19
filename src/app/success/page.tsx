"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    // You could verify the session here if needed
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">Error</h1>
          <p className="text-stone-600 mb-6">{error}</p>
          <Link
            href="/collections"
            className="bg-stone-800 text-white px-6 py-2 rounded-md hover:bg-stone-900 transition-colors"
          >
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-green-600 mb-6">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-serif text-stone-800 mb-4">Purchase Successful!</h1>
          
          <p className="text-stone-600 mb-8">
            Thank you for your purchase. Your exclusive content access has been activated. 
            You can now watch your content from your account page.
          </p>
          
          <div className="space-y-4">
            <Link
              href="/account"
              className="w-full inline-block bg-stone-800 text-white py-3 px-6 rounded-md hover:bg-stone-900 transition-colors font-medium"
            >
              View My Purchases
            </Link>
            
            <Link
              href="/collections"
              className="w-full inline-block border border-stone-300 text-stone-700 py-3 px-6 rounded-md hover:bg-stone-50 transition-colors"
            >
              Browse More Collections
            </Link>
          </div>
          
          <div className="mt-8 p-4 bg-stone-50 rounded-lg">
            <h3 className="font-semibold text-stone-800 mb-2">Important Notes:</h3>
            <ul className="text-sm text-stone-600 space-y-1">
              <li>• Your access is time-limited as specified in the collection details</li>
              <li>• Content cannot be downloaded or shared</li>
              <li>• Access expires automatically after the specified duration</li>
              <li>• Contact support if you experience any issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 