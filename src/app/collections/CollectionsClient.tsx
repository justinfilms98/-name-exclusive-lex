"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { motion } from 'framer-motion';

// Simplified interface for our media items
interface MediaItem {
  id: string;
  title: string;
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
      name: item.title,
      price: item.price,
      thumbnail: item.thumbnailPath,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  const isItemInCart = (itemId: string) => cartItems.some(cartItem => cartItem.id === itemId);
  
  if (!items) {
      return (
        <div className="flex justify-center items-center min-h-screen">
            <p className="text-lg text-[#654C37]">Loading collections...</p>
        </div>
      )
  }

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-serif tracking-widest uppercase" style={{ color: '#654C37' }}>
            Our Collections
          </h1>
          <p className="mt-4 text-lg text-stone-500 max-w-2xl mx-auto">
            Discover exclusive content, curated just for you. Each piece is a unique expression of intimacy and elegance.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative flex flex-col bg-white rounded-lg shadow-subtle overflow-hidden"
            >
              <div className="relative w-full aspect-video overflow-hidden">
                <img
                  src={item.thumbnailPath || '/placeholder-thumbnail.jpg'}
                  alt={item.title}
                  className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4 bg-white/90 text-[#654C37] px-3 py-1 text-sm font-semibold rounded-full shadow-md">
                  ${item.price?.toFixed(2)}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h2 className="text-xl font-semibold text-stone-800 mb-2 truncate">{item.title}</h2>
                <p className="text-stone-500 text-sm flex-grow mb-6 line-clamp-2">{item.description}</p>
                <div className="mt-auto">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={isItemInCart(item.id)}
                    className={`w-full py-3 px-5 rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:-translate-y-1 shadow-md ${
                      isItemInCart(item.id)
                        ? 'bg-emerald-500 text-white cursor-not-allowed'
                        : 'bg-[#D4C7B4] text-[#654C37] hover:bg-[#C8BBAA]'
                    }`}
                  >
                    {isItemInCart(item.id) ? 'Added to Cart ✓' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 