"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { CheckCircle, Download, Play, Clock } from 'lucide-react';
import Link from 'next/link';

interface PurchaseData {
  id: string;
  media: {
    id: string;
    title: string;
    description?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
  };
  amountPaid: number;
  expiresAt: string;
  createdAt: string;
}

export default function SuccessClient() {
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    verifyPurchase(sessionId);
  }, [searchParams]);

  const verifyPurchase = async (sessionId: string) => {
    try {
      const response = await fetch('/api/verify-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify purchase');
      }

      const data = await response.json();
      setPurchase(data.purchase);
    } catch (err) {
      setError('Failed to verify your purchase. Please contact support.');
      console.error('Purchase verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-800 mx-auto mb-4"></div>
          <p className="text-stone-600">Verifying your purchase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif text-stone-800 mb-4">Verification Failed</h1>
          <p className="text-stone-600 mb-6">{error}</p>
          <Link href="/collections">
            <button className="w-full bg-stone-800 text-white px-6 py-3 rounded-md font-semibold hover:bg-stone-900 transition-colors">
              Return to Collections
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600">No purchase data found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-serif text-stone-800 mb-2">Purchase Successful!</h1>
          <p className="text-stone-600 mb-4">
            Thank you for your purchase. Your access to the exclusive content has been granted.
          </p>
          <div className="flex items-center justify-center text-sm text-stone-500">
            <Clock className="w-4 h-4 mr-2" />
            <span>{getTimeRemaining(purchase.expiresAt)}</span>
          </div>
        </div>

        {/* Purchase Details */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-serif text-stone-800 mb-6">Purchase Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-stone-700 mb-2">Item</h3>
              <p className="text-stone-600">{purchase.media.title}</p>
              {purchase.media.description && (
                <p className="text-stone-500 text-sm mt-1">{purchase.media.description}</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-stone-700 mb-2">Amount Paid</h3>
              <p className="text-2xl font-bold text-emerald-600">
                ${purchase.amountPaid.toFixed(2)}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-stone-700 mb-2">Purchase Date</h3>
              <p className="text-stone-600">{formatDate(purchase.createdAt)}</p>
            </div>
            <div>
              <h3 className="font-semibold text-stone-700 mb-2">Access Expires</h3>
              <p className="text-stone-600">{formatDate(purchase.expiresAt)}</p>
            </div>
          </div>
        </div>

        {/* Content Access */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-serif text-stone-800 mb-6">Access Your Content</h2>
          
          {purchase.media.videoUrl ? (
            <div className="space-y-4">
              {purchase.media.thumbnailUrl && (
                <div className="aspect-video bg-stone-100 rounded-lg overflow-hidden">
                  <img 
                    src={purchase.media.thumbnailUrl} 
                    alt={purchase.media.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={`/watch/${purchase.media.id}`}>
                  <button className="flex-1 bg-stone-800 text-white px-6 py-3 rounded-md font-semibold hover:bg-stone-900 transition-colors flex items-center justify-center">
                    <Play className="w-5 h-5 mr-2" />
                    Watch Now
                  </button>
                </Link>
                
                <button 
                  onClick={() => window.open(purchase.media.videoUrl, '_blank')}
                  className="flex-1 border border-stone-300 text-stone-700 px-6 py-3 rounded-md font-semibold hover:bg-stone-50 transition-colors flex items-center justify-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-stone-600 mb-4">Content is being prepared. You'll receive an email when it's ready.</p>
              <Link href="/account">
                <button className="bg-stone-800 text-white px-6 py-3 rounded-md font-semibold hover:bg-stone-900 transition-colors">
                  Go to My Account
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link href="/collections">
            <button className="text-stone-600 hover:text-stone-800 transition-colors">
              ← Browse More Content
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}