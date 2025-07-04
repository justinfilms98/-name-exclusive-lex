"use client";

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, LogIn } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error') || null;
  const description = searchParams?.get('description') || null;

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'access_denied':
        return 'You cancelled the sign-in process.';
      case 'missing_code':
        return 'Authentication code was not received. Please try again.';
      case 'exchange_failed':
        return 'Failed to complete authentication. Please try again.';
      case 'no_session':
        return 'Authentication session could not be created.';
      case 'callback_exception':
        return 'An unexpected error occurred during sign-in.';
      case 'DNS_PROBE_FINISHED_NXDOMAIN':
        return 'Network connection issue. Please check your internet connection.';
      default:
        return description || 'An error occurred during sign-in.';
    }
  };

  const getErrorTitle = (errorCode: string | null) => {
    switch (errorCode) {
      case 'access_denied':
        return 'Sign-in Cancelled';
      case 'DNS_PROBE_FINISHED_NXDOMAIN':
        return 'Connection Error';
      default:
        return 'Authentication Error';
    }
  };

  const errorTitle = getErrorTitle(error);
  const errorMessage = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6"
          >
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            {errorTitle}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-8"
          >
            {errorMessage}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <Link
            href="/login"
            className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Try Again
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </button>

          <Link
            href="/"
            className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Link>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-4 bg-gray-50 rounded-lg"
          >
            <p className="text-xs text-gray-500 mb-2">Error Details (for debugging):</p>
            <p className="text-xs text-gray-700 font-mono break-all">
              {error}: {description}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
} 