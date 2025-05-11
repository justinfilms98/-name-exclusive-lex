import React from 'react'

export default function PricingPage() {
  return (
    <div className="min-h-screen px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#2E4A2E] mb-8 text-center">
          Choose Your Plan
        </h1>
        <p className="font-sans text-lg text-[#3C2F2F] mb-12 text-center max-w-2xl mx-auto">
          Select the perfect plan for your exclusive content needs. All plans include secure access and premium quality videos.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Basic Plan */}
          <div className="bg-[#F2E8D5] rounded-lg p-8 shadow-lg">
            <h2 className="font-serif text-2xl font-bold text-[#2E4A2E] mb-4">Basic</h2>
            <p className="text-4xl font-bold text-[#3C2F2F] mb-6">$9.99<span className="text-lg">/month</span></p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                Access to basic content
              </li>
              <li className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                Standard quality
              </li>
              <li className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                Monthly updates
              </li>
            </ul>
            <button className="w-full bg-[#2E4A2E] text-[#F2E8D5] py-3 rounded-lg hover:bg-[#3C2F2F] transition">
              Get Started
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-[#F2E8D5] rounded-lg p-8 shadow-lg border-2 border-[#2E4A2E]">
            <div className="bg-[#2E4A2E] text-[#F2E8D5] py-1 px-4 rounded-full text-sm font-bold inline-block mb-4">
              Most Popular
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#2E4A2E] mb-4">Premium</h2>
            <p className="text-4xl font-bold text-[#3C2F2F] mb-6">$19.99<span className="text-lg">/month</span></p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                Full content access
              </li>
              <li className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                HD quality
              </li>
              <li className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                Weekly updates
              </li>
              <li className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                Priority support
              </li>
            </ul>
            <button className="w-full bg-[#2E4A2E] text-[#F2E8D5] py-3 rounded-lg hover:bg-[#3C2F2F] transition">
              Get Started
            </button>
          </div>

          {/* VIP Plan */}
          <div className="bg-[#F2E8D5] rounded-lg p-8 shadow-lg">
            <h2 className="font-serif text-2xl font-bold text-[#2E4A2E] mb-4">VIP</h2>
            <p className="text-4xl font-bold text-[#3C2F2F] mb-6">$29.99<span className="text-lg">/month</span></p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                All premium features
              </li>
              <li className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                4K quality
              </li>
              <li className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                Daily updates
              </li>
              <li className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                24/7 VIP support
              </li>
              <li className="flex items-center text-[#3C2F2F]">
                <span className="mr-2">✓</span>
                Exclusive content
              </li>
            </ul>
            <button className="w-full bg-[#2E4A2E] text-[#F2E8D5] py-3 rounded-lg hover:bg-[#3C2F2F] transition">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 