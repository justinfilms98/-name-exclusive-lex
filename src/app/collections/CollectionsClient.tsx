"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { motion } from 'framer-motion';

// Simplified interface for our media items
interface MediaItem {
  id: string;
  description: string | null;
  thumbnailPath: string | null;
  price: number | null;
  duration: number | null;
}

export default function CollectionsClient({ items }: { items: MediaItem[] }) {
  const { push } = useRouter();
  const { addToCart, cartItems } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleAddToCart = (item: MediaItem) => {
    if (!item.price) return;
    
    addToCart({
      id: item.id,
      name: item.description || 'Exclusive Content',
      price: item.price,
      thumbnail: item.thumbnailPath,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 2000); // Reset after 2 seconds
  };

  const isItemInCart = (itemId: string) => {
    return cartItems.some(cartItem => cartItem.id === itemId);
  };
  
  if (!items) {
      return <div>Loading...</div>
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white pt-28 pb-12">
      <div className="container mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-serif text-center mb-12"
        >
          Collections
        </motion.h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col"
            >
              <div className="relative w-full aspect-[9/16]">
                <img
                  src={item.thumbnailPath || '/placeholder-thumbnail.jpg'}
                  alt={item.description || 'Media thumbnail'}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h2 className="text-lg font-bold mb-2 truncate">{item.description}</h2>
                <p className="text-pink-500 font-bold mb-4">${item.price?.toFixed(2)}</p>
                <div className="mt-auto">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={isItemInCart(item.id)}
                    className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
                      isItemInCart(item.id)
                        ? 'bg-green-600 cursor-not-allowed'
                        : 'bg-pink-600 hover:bg-pink-700'
                    }`}
                  >
                    {isItemInCart(item.id) ? 'Added ✓' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
} 