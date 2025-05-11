'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function WarningPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F2E8D5] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <h1 className="font-serif text-3xl font-bold text-[#2E4A2E] mb-4">
          Content Protection Warning
        </h1>
        <p className="text-[#3C2F2F] mb-6">
          We've detected an attempt to capture or modify our protected content. 
          This action is not permitted and may result in account termination.
        </p>
        <div className="space-y-4">
          <Button
            onClick={() => router.push('/')}
            className="w-full bg-[#2E4A2E] text-[#F2E8D5] hover:bg-[#3C2F2F]"
          >
            Return to Home
          </Button>
          <p className="text-sm text-[#3C2F2F]">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
} 