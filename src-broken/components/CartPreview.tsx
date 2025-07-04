"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useCart } from '@/context/CartContext';

export function CartPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { cartItems, removeFromCart, itemCount } = useCart();
  const controls = useAnimation();

  // Enhanced hover animation for cart icon
  useEffect(() => {
    if (isHovered) {
      controls.start({
        scale: 1.1,
        rotate: [0, -10, 10, -5, 5, 0],
        transition: { duration: 0.5 }
      });
    } else {
      controls.start({ scale: 1, rotate: 0 });
    }
  }, [isHovered, controls]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-close dropdown after 5 seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isOpen) {
      timeout = setTimeout(() => setIsOpen(false), 5000);
    }
    return () => clearTimeout(timeout);
  }, [isOpen]);

  const handleHoverStart = () => {
    setIsHovered(true);
    setIsOpen(true);
  };

  const handleCheckout = () => {
    router.push('/cart');
    setIsOpen(false);
  };

  const handleRemoveItem = (e: React.MouseEvent<HTMLButtonElement>, itemId: string) => {
    e.stopPropagation(); // Prevent dropdown from closing
    removeFromCart(itemId);
  };

  // Calculate totals locally since they are not in the context
  const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
  const tax = subtotal * 0.08; // Example 8% tax
  const total = subtotal + tax;

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onHoverStart={handleHoverStart}
        onHoverEnd={() => setIsHovered(false)}
        animate={controls}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#654C37] hover:text-[#654C37]/80 transition-colors"
        aria-label="Cart"
      >
        <motion.svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          whileTap={{ scale: 0.9 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </motion.svg>
        {itemCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            whileHover={{ scale: 1.2 }}
          >
            {itemCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#654C37]">Shopping Cart</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="text-[#654C37]/60 hover:text-[#654C37] p-1"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              
              {cartItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-16 h-16 mx-auto mb-4 text-[#654C37]/40"
                  >
                    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </motion.div>
                  <p className="text-[#654C37]/60">Your cart is empty</p>
                </motion.div>
              ) : (
                <>
                  <motion.div 
                    className="max-h-96 overflow-y-auto space-y-4 custom-scrollbar"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <AnimatePresence mode="popLayout">
                      {cartItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                            delay: index * 0.05 
                          }}
                          className="flex gap-3 items-center group"
                        >
                          <motion.div 
                            className="relative w-20 h-16 rounded overflow-hidden flex-shrink-0"
                            whileHover={{ scale: 1.05 }}
                          >
                            <Image
                              src={item.thumbnail || '/placeholder-thumbnail.jpg'}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-[#654C37] truncate group-hover:text-[#654C37]/80 transition-colors">
                              {item.name}
                            </h4>
                            <p className="text-sm text-[#654C37]/60">${item.price.toFixed(2)}</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleRemoveItem(e, item.id)}
                            className="text-red-500 hover:text-red-600 transition-colors p-1 opacity-0 group-hover:opacity-100"
                            aria-label="Remove item"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div 
                    className="border-t border-[#654C37]/10 mt-4 pt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="font-semibold">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tax</span>
                        <span className="font-semibold">${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-bold">Total</span>
                        <span className="font-bold">${total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCheckout}
                        className="flex-1 bg-[#654C37] text-white py-2 px-4 rounded-lg hover:bg-[#654C37]/90 transition-colors"
                      >
                        View Cart
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setIsOpen(false);
                          router.push('/checkout');
                        }}
                        className="flex-1 bg-[#D4C7B4] text-[#654C37] py-2 px-4 rounded-lg hover:bg-[#D4C7B4]/90 transition-colors"
                      >
                        Checkout
                      </motion.button>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 