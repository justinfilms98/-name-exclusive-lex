'use client'

import React, { useState } from 'react'
import { TierCard } from './tier-card'
import { SubscriptionForm } from './subscription-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const tiers = [
  {
    title: 'Basic',
    price: 9.99,
    period: 'month',
    description: 'Perfect for getting started with exclusive content',
    benefits: [
      'Access to basic video content',
      'Standard quality streaming',
      'Basic customer support',
      'Monthly content updates'
    ]
  },
  {
    title: 'Premium',
    price: 19.99,
    period: 'month',
    description: 'Our most popular plan with enhanced features',
    benefits: [
      'Access to all video content',
      'HD quality streaming',
      'Priority customer support',
      'Weekly content updates',
      'Exclusive behind-the-scenes',
      'Early access to new releases'
    ],
    isPopular: true
  },
  {
    title: 'Elite',
    price: 29.99,
    period: 'month',
    description: 'Ultimate VIP experience with all premium features',
    benefits: [
      'Access to all content',
      '4K quality streaming',
      '24/7 VIP support',
      'Daily content updates',
      'Exclusive behind-the-scenes',
      'Early access to new releases',
      'Personal content recommendations',
      'Priority access to live events'
    ]
  }
]

export function VipTiers() {
  const [selectedTier, setSelectedTier] = useState<typeof tiers[0] | null>(null)

  const handleTierSelect = (tier: typeof tiers[0]) => {
    setSelectedTier(tier)
  }

  const handleCloseForm = () => {
    setSelectedTier(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {tiers.map((tier) => (
        <div key={tier.title} className="bg-[#F2E8D5] rounded-lg p-8 shadow-lg">
          {tier.isPopular && (
            <div className="bg-[#2E4A2E] text-[#F2E8D5] py-1 px-4 rounded-full text-sm font-bold inline-block mb-4">
              Most Popular
            </div>
          )}
          <h2 className="font-serif text-2xl font-bold text-[#2E4A2E] mb-4">{tier.title}</h2>
          <p className="text-4xl font-bold text-[#3C2F2F] mb-6">${tier.price}<span className="text-lg">/{tier.period}</span></p>
          <p className="text-[#3C2F2F] mb-6">{tier.description}</p>
          <ul className="space-y-4 mb-8">
            {tier.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleTierSelect(tier)}
            className="w-full bg-[#2E4A2E] text-[#F2E8D5] py-3 rounded-lg hover:bg-[#3C2F2F] transition font-sans uppercase tracking-wide"
          >
            Select Plan
          </button>
        </div>
      ))}

      <Dialog open={!!selectedTier} onOpenChange={handleCloseForm}>
        <DialogContent className="bg-[#F2E8D5] text-[#3C2F2F]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold text-[#2E4A2E]">
              Complete Your Subscription
            </DialogTitle>
          </DialogHeader>
          {selectedTier && (
            <SubscriptionForm
              tier={selectedTier}
              onClose={handleCloseForm}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 