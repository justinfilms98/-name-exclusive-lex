'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface SubscriptionFormProps {
  tier: {
    title: string
    price: number
    period: string
  }
  onClose: () => void
}

export function SubscriptionForm({ tier, onClose }: SubscriptionFormProps) {
  return (
    <form className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#3C2F2F]">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="mt-1 block w-full rounded-md border-[#C0B4AC] bg-white px-3 py-2 text-[#3C2F2F] shadow-sm focus:border-[#2E4A2E] focus:ring-[#2E4A2E]"
            placeholder="Enter your email"
            required
          />
        </div>
        <div>
          <label htmlFor="card" className="block text-sm font-medium text-[#3C2F2F]">
            Card Details
          </label>
          <input
            type="text"
            id="card"
            className="mt-1 block w-full rounded-md border-[#C0B4AC] bg-white px-3 py-2 text-[#3C2F2F] shadow-sm focus:border-[#2E4A2E] focus:ring-[#2E4A2E]"
            placeholder="Card number"
            required
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-[#3C2F2F]">
          <span className="font-bold">${tier.price}</span>/{tier.period}
        </p>
        <div className="space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-[#2E4A2E] text-[#2E4A2E] hover:bg-[#2E4A2E] hover:text-[#F2E8D5]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#2E4A2E] text-[#F2E8D5] hover:bg-[#3C2F2F]"
          >
            Subscribe
          </Button>
        </div>
      </div>
    </form>
  )
} 