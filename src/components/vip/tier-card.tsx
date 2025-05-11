'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

interface TierCardProps {
  title: string
  price: number
  period: string
  description: string
  benefits: string[]
  isPopular?: boolean
  onSelect: () => void
}

export function TierCard({
  title,
  price,
  period,
  description,
  benefits,
  isPopular = false,
  onSelect,
}: TierCardProps) {
  return (
    <div className={`relative rounded-lg border bg-white p-6 shadow-md transition-all hover:shadow-xl ${
      isPopular ? 'border-rose-500' : 'border-gray-200'
    }`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-rose-500 px-4 py-1 text-sm font-semibold text-white">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold">{title}</h3>
        <div className="mt-2 flex items-baseline">
          <span className="text-4xl font-bold">${price}</span>
          <span className="ml-1 text-gray-500">/{period}</span>
        </div>
        <p className="mt-2 text-gray-600">{description}</p>
      </div>

      <ul className="mb-6 space-y-3">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-center">
            <Check className="mr-2 h-5 w-5 text-rose-500" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onSelect}
        className={`w-full ${
          isPopular
            ? 'bg-rose-500 hover:bg-rose-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
        }`}
      >
        Select Plan
      </Button>
    </div>
  )
} 