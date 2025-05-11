'use client'

import React from 'react'
import { useCart } from '@/context/cart-context'

// Generate 20 placeholder items
const videos = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  title: `Premium Video ${i + 1}`,
  thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1920&auto=format&fit=crop',
  price: (19.99 + i * 2).toFixed(2),
  duration: `${Math.floor(Math.random() * 20 + 10)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
}))

export function CollectionsGrid() {
  const { addItem } = useCart()

  const handleAddToCart = (id: string) => {
    const video = videos.find(v => v.id === id)
    if (video) {
      addItem({
        id: video.id,
        title: video.title,
        description: "To be updated",
        thumbnailKey: video.thumbnail,
        price: parseFloat(video.price),
        type: 'per_watch',
        creator: { name: "To be updated", image: "" },
        createdAt: new Date().toISOString(),
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-['Playfair_Display'] font-bold text-[#5E4B4B]">Premium Collections</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="bg-[#F2E8D5] rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
            <div className="aspect-[2/3] overflow-hidden">
              <img 
                src={video.thumbnail} 
                alt={video.title} 
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-4">
              <h3 className="font-serif text-lg text-[#2E4A2E] font-bold">{video.title}</h3>
              <p className="font-sans text-[#3C2F2F] mt-1">${video.price}</p>
              <button 
                onClick={() => handleAddToCart(video.id)}
                className="mt-4 w-full bg-[#2E4A2E] text-[#F2E8D5] py-2 rounded-lg hover:bg-[#3C2F2F] transition font-sans uppercase tracking-wide"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 