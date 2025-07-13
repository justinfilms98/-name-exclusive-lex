"use client";
import Link from 'next/link';

export default function AccountClient({ user, purchases }: { user: any, purchases: any[] }) {
  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-serif text-stone-800 mb-2">My Account</h1>
              <p className="text-stone-600">{user?.email}</p>
            </div>
            <Link href="/api/auth/signout" className="bg-stone-800 text-white px-4 py-2 rounded-md hover:bg-stone-900 transition-colors">Sign Out</Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-4">My Purchases</h2>
          {purchases && purchases.length > 0 ? (
            <ul>
              {purchases.map((purchase) => (
                <li key={purchase.id} className="mb-2">
                  {purchase.CollectionVideo?.title || 'Untitled Video'}
                </li>
              ))}
            </ul>
          ) : (
            <p>No purchases found.</p>
          )}
        </div>
      </div>
    </div>
  );
}