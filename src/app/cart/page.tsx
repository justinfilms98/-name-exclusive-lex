"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";

interface SuggestedVideo {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  videoUrl: string;
}

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, removeItem, subtotal, tax, total, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedVideos, setSuggestedVideos] = useState<SuggestedVideo[]>([]);

  // Fetch suggested videos
  useEffect(() => {
    async function fetchSuggestedVideos() {
      try {
        const response = await fetch('/api/collection-videos');
        if (!response.ok) throw new Error('Failed to fetch suggested videos');
        const videos: SuggestedVideo[] = await response.json();
        
        // Filter out videos that are already in cart
        const cartIds = new Set(items.map(item => item.id));
        const filteredVideos = videos
          .filter(video => !cartIds.has(video.id))
          .slice(0, 3); // Show up to 3 suggestions
        
        setSuggestedVideos(filteredVideos);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }

    if (items.length > 0) {
      fetchSuggestedVideos();
    }
  }, [items]);

  const handleCheckout = async () => {
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setIsCheckingOut(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          userEmail: session.user?.email
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      if (data.url) {
        clearCart(); // Clear cart after successful checkout initiation
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#D4C7B4] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[#654C37] text-xl"
        >
          Loading cart...
        </motion.div>
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#D4C7B4] pt-28 pb-12"
    >
      <div className="container mx-auto px-4">
        <motion.h1
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-4xl font-bold text-[#654C37] mb-8"
        >
          Shopping Cart
        </motion.h1>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {items.length === 0 ? (
            <motion.div
              key="empty-cart"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12 bg-white rounded-lg shadow-lg max-w-md mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 mx-auto mb-6 text-[#654C37]"
              >
                <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-semibold text-[#654C37] mb-4"
              >
                Your cart is empty
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[#654C37]/80 mb-6"
              >
                Browse our collections to find your next favorite video
              </motion.p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/collections"
                  className="inline-block bg-[#654C37] text-white px-8 py-3 rounded-lg hover:bg-[#654C37]/90 transition-colors"
                >
                  Browse Collections
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="cart-items"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                      className="bg-white rounded-lg shadow-md p-6 flex items-center gap-6"
                    >
                      <div className="relative w-32 h-24 rounded-lg overflow-hidden">
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#654C37] mb-2">{item.title}</h3>
                        <p className="text-[#654C37]/80 text-sm mb-2 line-clamp-2">{item.description}</p>
                        <p className="text-[#654C37] font-medium">${item.price.toFixed(2)}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-600 transition-colors p-2"
                        aria-label="Remove item"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Suggested Videos */}
                {suggestedVideos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12"
                  >
                    <h2 className="text-2xl font-semibold text-[#654C37] mb-6">You might also like</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {suggestedVideos.map((video, index) => (
                        <motion.div
                          key={video.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                        >
                          <Link
                            href={`/collections/${video.id}`}
                            className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow block"
                          >
                            <div className="relative aspect-video">
                              <Image
                                src={video.thumbnail}
                                alt={video.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="font-medium text-[#654C37] group-hover:text-[#654C37]/80 transition-colors">
                                {video.title}
                              </h3>
                              <p className="text-[#654C37]/60 text-sm mt-1">${video.price.toFixed(2)}</p>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-1"
              >
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-28">
                  <h2 className="text-2xl font-semibold text-[#654C37] mb-6">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between text-[#654C37]">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#654C37]">
                      <span>Tax (10%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-[#654C37]/20 pt-4 mt-4">
                      <div className="flex justify-between font-semibold text-[#654C37]">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={isCheckingOut || items.length === 0}
                    className={`w-full mt-6 py-3 px-6 rounded-lg font-medium transition-colors ${
                      isCheckingOut || items.length === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-[#654C37] text-white hover:bg-[#654C37]/90'
                    }`}
                  >
                    {isCheckingOut ? 'Processing...' : session ? 'Proceed to Checkout' : 'Sign in to Checkout'}
                  </motion.button>
                  {!session && (
                    <p className="text-sm text-[#654C37]/60 mt-4 text-center">
                      Please sign in to complete your purchase
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
} 