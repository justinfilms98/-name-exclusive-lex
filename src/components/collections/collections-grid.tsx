'use client'

import React, { useState } from 'react'
import { useCart } from '@/context/cart-context'
import Image from 'next/image'
import { cn } from '@/lib/utils'

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
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

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

  const handleImageLoad = (id: string) => {
    setLoadingStates(prev => ({ ...prev, [id]: false }))
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-['Playfair_Display'] font-bold text-[#5E4B4B] text-center sm:text-left">
        Premium Collections
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {videos.map((video: any, index: number) => (
          <div key={video.id} className="bg-[#F2E8D5] rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105">
            <div className="relative aspect-[16/9] sm:aspect-[2/3] overflow-hidden bg-gray-200">
              <div className={cn(
                "absolute inset-0 bg-gray-200 animate-pulse",
                loadingStates[video.id] === false && "hidden"
              )} />
              <Image 
                src={video.thumbnail} 
                alt={video.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-opacity duration-300"
                onLoad={() => handleImageLoad(video.id)}
                priority={parseInt(video.id) <= 4}
              />
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="font-serif text-base sm:text-lg text-[#2E4A2E] font-bold line-clamp-2">{video.title}</h3>
              <p className="font-sans text-sm sm:text-base text-[#3C2F2F] mt-1">${video.price}</p>
              <button 
                onClick={() => handleAddToCart(video.id)}
                className="mt-3 sm:mt-4 w-full bg-[#2E4A2E] text-[#F2E8D5] py-2 rounded-lg hover:bg-[#3C2F2F] transition font-sans text-sm sm:text-base uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loadingStates[video.id]}
              >
                {loadingStates[video.id] ? 'Loading...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 