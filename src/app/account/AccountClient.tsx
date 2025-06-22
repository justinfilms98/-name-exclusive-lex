'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { motion } from 'framer-motion';
import { Video, RefreshCw, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { PurchaseHistoryItem } from '@/lib/types';

export default function AccountClient({ purchases }: { purchases: PurchaseHistoryItem[] }) {
  const { addToCart, cartItems } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleRepurchase = (purchase: PurchaseHistoryItem) => {
    addToCart({
      id: purchase.video.id,
      name: purchase.video.title,
      price: purchase.video.price,
      thumbnail: purchase.video.thumbnailPath,
    });
    setAddedId(purchase.video.id);
    setTimeout(() => setAddedId(null), 2000); // Reset after 2 seconds
  };

  const isItemInCart = (videoId: string) => {
    return cartItems.some(cartItem => cartItem.id === videoId);
  };

  const now = new Date();

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-24 sm:pt-32 pb-12">
      <div className="container mx-auto px-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-serif text-center mb-12"
        >
          My Account
        </motion.h1>

        <div className="bg-gray-800 rounded-lg shadow-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-4">Purchase History</h2>
          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-500 mb-4" />
              <p className="text-gray-400">You haven't made any purchases yet.</p>
              <Link href="/collections" className="text-pink-500 hover:underline mt-2 inline-block">
                Browse Collections
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {purchases.map((purchase, index) => {
                const isExpired = purchase.expiresAt ? new Date(purchase.expiresAt) < now : true;
                const isInCart = isItemInCart(purchase.video.id);

                return (
                  <motion.div
                    key={purchase.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex flex-col md:flex-row items-center bg-gray-700/50 p-4 rounded-lg"
                  >
                    <img
                      src={purchase.video.thumbnailPath || '/placeholder-thumbnail.jpg'}
                      alt={purchase.video.title}
                      className="w-full md:w-40 h-auto md:h-24 object-cover rounded-md mb-4 md:mb-0 md:mr-6"
                    />
                    <div className="flex-grow text-center md:text-left">
                      <h3 className="text-xl font-bold">{purchase.video.title}</h3>
                      <p className="text-sm text-gray-400">
                        Purchased on: {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </p>
                      <p className={`text-sm ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                        {isExpired
                          ? `Access Expired on ${purchase.expiresAt ? new Date(purchase.expiresAt).toLocaleDateString() : 'N/A'}`
                          : `Access until ${purchase.expiresAt ? new Date(purchase.expiresAt).toLocaleDateString() : 'N/A'}`}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
                      {isExpired ? (
                        <button
                          onClick={() => handleRepurchase(purchase)}
                          disabled={isInCart}
                          className={`w-full md:w-auto flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${
                            isInCart 
                              ? 'bg-green-600 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          <RefreshCw className={`mr-2 h-4 w-4`} />
                          {isInCart ? 'Added ✓' : 'Re-purchase'}
                        </button>
                      ) : (
                        <Link href={`/watch/${purchase.video.id}`} className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold transition-transform duration-300 transform hover:scale-105">
                          <Video className="mr-2 h-4 w-4" />
                          Watch Now
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}