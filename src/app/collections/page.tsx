import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections - Exclusive Lex',
  description: 'Browse our exclusive video collections',
};

export default function CollectionsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-900 mb-8">Collections</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder for collection items */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="aspect-video bg-gray-200 rounded mb-4"></div>
          <h2 className="text-xl font-semibold text-green-900 mb-2">Premium Collection</h2>
          <p className="text-gray-600 mb-4">Access our premium video content</p>
          <button className="bg-green-900 text-white px-4 py-2 rounded hover:bg-green-800">
            View Collection
          </button>
        </div>
        {/* Add more collection items as needed */}
      </div>
    </main>
  );
} 