import React from 'react'
import { VipTiers } from '@/components/vip/vip-tiers'

export default function VipPage() {
  return (
    <div className="min-h-screen px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#2E4A2E] mb-8 text-center">
          VIP Experience
        </h1>
        <p className="font-sans text-lg text-[#3C2F2F] mb-12 text-center max-w-2xl mx-auto">
          Unlock exclusive VIP features and enjoy premium content with our elite membership.
        </p>
        <VipTiers />
      </div>
    </div>
  )
} 