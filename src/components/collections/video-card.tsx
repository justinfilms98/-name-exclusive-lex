'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'

interface VideoCardProps {
  id: string
  title: string
  thumbnail: string
  price: number
  duration: string
  onAddToCart: (id: string) => void
}

export function VideoCard({
  id,
  title,
  thumbnail,
  price,
  duration,
  onAddToCart,
}: VideoCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-xl">
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
        
        {/* Duration Badge */}
        <Badge 
          variant="secondary" 
          className="absolute bottom-2 right-2 bg-black/70 text-white"
        >
          {duration}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold line-clamp-2">{title}</h3>
        
        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">${price.toFixed(2)}</span>
          <Button
            onClick={() => onAddToCart(id)}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
} 