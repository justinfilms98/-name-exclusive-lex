"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // This would typically be a unique ID for the content they purchased.
  // For now, we'll retrieve it from localStorage or an API call if needed.
  // We'll assume the videoId is available, for a real app you might fetch this based on session_id
  const [videoId, setVideoId] = useState<string | null>(null);


  useEffect(() => {
    // In a real app, you would make a call to your backend with the `session_id`
    // to get purchase details, like the specific videoId that was purchased.
    // For this example, let's assume a single-item purchase and that we can
    // retrieve the videoId that initiated the checkout.
    
    // A simple way for the demo, but not secure for production:
    const purchasedVideoId = localStorage.getItem('last_purchased_video_id');
    if (purchasedVideoId) {
      setVideoId(purchasedVideoId);
      // Clean up local storage after use
      localStorage.removeItem('last_purchased_video_id');
    }

    if (sessionId) {
      console.log('Checkout session successful:', sessionId);
      // You could verify the session on the backend here if needed.
      setIsLoading(false);
    } else {
        // If there is no session ID, maybe they navigated here directly.
        // Redirect them to a safe page.
        router.push('/');
    }
  }, [sessionId, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <h1 className="text-4xl font-bold mb-4">Verifying your purchase...</h1>
        <p>Please wait a moment.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center text-white bg-gray-900">
      <div className="p-10 bg-gray-800 rounded-lg shadow-2xl max-w-lg">
        <h1 className="text-5xl font-extrabold text-green-400 mb-4">Purchase Successful!</h1>
        <p className="text-lg mb-6">
          Thank you for your purchase. Your access has been granted and is now available.
        </p>
        
        {videoId ? (
            <Link href={`/watch/${videoId}`}>
                <a className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
                    Watch Now
                </a>
            </Link>
        ) : (
            <p className="text-md text-gray-400">Unable to retrieve purchase details. Please check your account page.</p>
        )}

        <div className="mt-8">
          <Link href="/collections">
            <a className="text-gray-400 hover:text-white transition duration-300">
              &larr; Back to Collections
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}