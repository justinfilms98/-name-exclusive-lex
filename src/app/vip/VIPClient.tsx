"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VIPClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-900"></div>
        </div>
      </main>
    );
  }

  if (!session) {
    return null; // Will redirect due to useEffect
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-900 mb-8">VIP Access</h1>
        {/* VIP Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Featured VIP Content */}
          <div className="col-span-full bg-gradient-to-r from-green-900 to-green-800 rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">Featured VIP Content</h2>
            <p className="mb-4">Access exclusive videos and premium content available only to VIP members.</p>
            <div className="aspect-video bg-black/20 rounded-lg mb-4"></div>
            <button className="bg-white text-green-900 px-6 py-2 rounded font-semibold hover:bg-gray-100 transition-colors">
              Watch Now
            </button>
          </div>
          {/* VIP Benefits */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-green-900 mb-4">VIP Benefits</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="text-green-900 mr-2">✓</span>
                Exclusive video content
              </li>
              <li className="flex items-center">
                <span className="text-green-900 mr-2">✓</span>
                Early access to new releases
              </li>
              <li className="flex items-center">
                <span className="text-green-900 mr-2">✓</span>
                HD quality streaming
              </li>
              <li className="flex items-center">
                <span className="text-green-900 mr-2">✓</span>
                Ad-free experience
              </li>
            </ul>
          </div>
          {/* Recent VIP Videos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-green-900 mb-4">Recent VIP Videos</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-32 h-20 bg-gray-200 rounded"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">VIP Video {i}</h4>
                    <p className="text-sm text-gray-600">Added recently</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 