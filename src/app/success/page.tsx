import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="bg-white p-10 rounded-lg shadow-lg text-center max-w-md w-full">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-serif text-stone-800 mb-2">Purchase Successful!</h1>
        <p className="text-stone-600 mb-6">
          Thank you for your purchase. Your access to the exclusive content has been granted.
        </p>
        <Link href="/account">
            <button className="w-full bg-stone-800 text-white px-6 py-3 rounded-md font-semibold hover:bg-stone-900 transition-colors">
                Go to My Account
            </button>
        </Link>
      </div>
    </div>
  );
} 