'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart } from 'lucide-react'

interface BundleCardProps {
  id: string
  title: string
  description: string
  thumbnail: string
  price: number
  savings: number
  onAddToCart: (id: string, quantity: number) => void
}

export function BundleCard({
  id,
  title,
  description,
  thumbnail,
  price,
  savings,
  onAddToCart,
}: BundleCardProps) {
  const [quantity, setQuantity] = useState(1)

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setQuantity(value)
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-xl">
      {/* Thumbnail Background */}
      <div className="relative h-48">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/20" />
        
        {/* Savings Badge */}
        <div className="absolute top-4 right-4">
          <span className="rounded-full bg-rose-500 px-3 py-1 text-sm font-semibold text-white">
            Save {savings}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="mb-2 text-xl font-bold">{title}</h3>
        <p className="mb-4 text-gray-600">{description}</p>
        
        {/* Price and Quantity */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold">${price.toFixed(2)}</span>
            <span className="ml-2 text-sm text-gray-500">per bundle</span>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor={`quantity-${id}`} className="text-sm text-gray-600">
              Qty:
            </label>
            <Input
              id={`quantity-${id}`}
              type="number"
              min="1"
              value={quantity}
              onChange={handleQuantityChange}
              className="w-16"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={() => onAddToCart(id, quantity)}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onAddToCart(id, quantity)}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  )
} 