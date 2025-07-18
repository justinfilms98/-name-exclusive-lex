import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-stone-800 mb-4">Authentication Error</h1>
        <p className="text-stone-600 mb-6">
          There was an error during the authentication process. Please try again.
        </p>
        <a 
          href="/login" 
          className="inline-block bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors"
        >
          Back to Login
        </a>
      </div>
    </div>
  );
} 