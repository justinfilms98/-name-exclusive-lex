"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, PlayCircle, Lock } from 'lucide-react';

export type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  price: number;
  durationSeconds: number | null;
};

const MediaCard = ({ item }: { item: MediaItem }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="group relative block w-full aspect-[3/4] overflow-hidden rounded-lg shadow-lg"
    >
      <img
        src={item.thumbnailUrl || '/placeholder-thumbnail.jpg'}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
        <h3 className="text-2xl font-serif font-semibold mb-2">{item.title}</h3>
        
        {/* Hover content */}
        <div className="absolute inset-0 p-6 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center">
          <p className="text-sm text-stone-200 mb-4">{item.description}</p>
          <div className="flex items-center text-xs text-stone-300 mb-6 space-x-4">
            <span>${item.price.toFixed(2)}</span>
            {item.durationSeconds && <span>{Math.floor(item.durationSeconds / 60)}m {item.durationSeconds % 60}s</span>}
          </div>
          <Link href={`/checkout?mediaId=${item.id}`} className="w-full">
            <button className="w-full bg-emerald-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-2">
              <Lock size={16} />
              <span>Purchase to Unlock</span>
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};


export default function CollectionsClient({ items }: { items: MediaItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-serif text-stone-700">The Collection is Growing</h2>
        <p className="text-stone-500 mt-4">New exclusive content will be available soon. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-5xl font-serif text-center text-stone-800 mb-12">Our Collections</h1>
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
        style={{ justifyItems: 'center' }}
      >
        {items.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
} 