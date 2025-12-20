"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Shield, XCircle } from 'lucide-react';

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const reason = searchParams?.get('reason');

  const getReasonMessage = () => {
    switch (reason) {
      case 'screen_capture':
        return {
          title: 'Screen Capture Detected',
          message: 'Your access has been revoked because screen capture software or screenshot attempts were detected. This content is protected and cannot be recorded or shared.',
          icon: <Shield className="w-16 h-16 text-red-500" />
        };
      case 'ip_mismatch':
        return {
          title: 'Access Denied',
          message: 'Your access has been revoked because this content was accessed from a different IP address than originally authorized.',
          icon: <XCircle className="w-16 h-16 text-red-500" />
        };
      default:
        return {
          title: 'Access Revoked',
          message: 'Your access to this content has been revoked due to security violations.',
          icon: <AlertTriangle className="w-16 h-16 text-red-500" />
        };
    }
  };

  const { title, message, icon } = getReasonMessage();

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          {icon}
          <h1 className="text-2xl font-bold text-stone-800 mt-4 mb-2">
            {title}
          </h1>
          <p className="text-stone-600 mb-6">
            {message}
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Security Notice</h3>
            <p className="text-red-700 text-sm">
              All access attempts are logged and monitored. Repeated violations may result in permanent account suspension.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/collections"
              className="block w-full bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-900 transition-colors font-medium text-center"
            >
              Browse Other Content
            </Link>
            
            <Link
              href="/account"
              className="block w-full bg-transparent border border-stone-300 text-stone-700 px-6 py-3 rounded-lg hover:bg-stone-50 transition-colors font-medium text-center"
            >
              My Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 