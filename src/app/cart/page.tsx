"use client";

import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trash2, ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function CartPage() {
  const { cartItems, removeFromCart, itemCount, clearCart } = useCart();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
  const taxRate = 0.08; // 8% tax rate
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setError(null);
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cartItems }),
    });

    if (response.ok) {
      const { redirectUrl } = await response.json();
      // Clear the cart before redirecting to Stripe
      clearCart();
      router.push(redirectUrl);
    } else {
      const { error } = await response.json();
      setError(error || 'Checkout failed. Please try again.');
      setIsCheckingOut(false);
    }
  };

  if (itemCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center px-4">
        <ShoppingCart className="w-24 h-24 text-gray-600 mb-6" />
        <h1 className="text-4xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-gray-400 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link href="/collections">
          <span className="flex items-center justify-center bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 cursor-pointer">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Collections
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-24 sm:pt-32 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4"
      >
        <h1 className="text-4xl font-serif text-white mb-8 text-center">Your Cart</h1>
        
        {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6 text-center">
                {error}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ul className="space-y-4">
              {cartItems.map(item => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.3 } }}
                  className="flex items-center bg-gray-800 p-4 rounded-lg shadow"
                >
                  <img src={item.thumbnail || '/placeholder-thumbnail.jpg'} alt={item.name} className="w-20 h-20 object-cover rounded-md mr-4"/>
                  <div className="flex-grow">
                    <h2 className="text-lg font-bold text-white">{item.name}</h2>
                    <p className="text-pink-400">${item.price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-fit">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Taxes ({(taxRate * 100).toFixed(0)}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white border-t border-gray-700 pt-4 mt-4">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full mt-8 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-300 transform hover:scale-105 disabled:bg-pink-800 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isCheckingOut ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 