import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Unauthorized</h1>
        <p className="text-lg text-gray-700 mb-8">
          You do not have permission to access this page.
        </p>
        <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
          Go to Homepage
        </Link>
      </div>
    </div>
  );
} 