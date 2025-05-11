'use client'

import React from 'react'
import { useCart } from '@/context/cart-context'
import { BundleCard } from './bundle-card'

// Sample data - replace with your actual data source
const bundles = [
  {
    id: 'bundle-1',
    title: 'Premium Monthly Bundle',
    description: 'Access to all premium content for one month',
    thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1920&auto=format&fit=crop',
    price: 29.99,
    savings: 20
  },
  {
    id: 'bundle-2',
    title: 'Premium Yearly Bundle',
    description: 'Access to all premium content for one year',
    thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1920&auto=format&fit=crop',
    price: 287.88,
    savings: 40
  },
  {
    id: '3',
    title: 'VIP Collection',
    description: 'Complete access to all content. Includes special features and early releases.',
    thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1920&auto=format&fit=crop',
    price: 149.99,
    savings: 40
  },
  {
    id: '4',
    title: 'Luxury Package',
    description: 'Ultimate experience with lifetime access and exclusive member benefits.',
    thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1920&auto=format&fit=crop',
    price: 299.99,
    savings: 50
  }
]

export function PricingGrid() {
  const { addItem } = useCart()

  const handleAddToCart = (id: string, quantity: number) => {
    const bundle = bundles.find(b => b.id === id)
    if (bundle) {
      for (let i = 0; i < quantity; i++) {
        addItem({
          id: bundle.id,
          title: bundle.title,
          description: bundle.description,
          thumbnailKey: bundle.thumbnail,
          price: bundle.price,
          type: bundle.id.includes('yearly') ? 'yearly' : 'monthly',
          creator: { name: "To be updated", image: "" },
          createdAt: new Date().toISOString(),
        })
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Choose Your Bundle</h1>
        <p className="text-lg text-gray-600">
          Select the perfect package for your exclusive content needs
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {bundles.map((bundle) => (
          <BundleCard
            key={bundle.id}
            {...bundle}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  )
} 