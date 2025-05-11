'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-4xl font-bold text-[#2E4A2E] mb-8 text-center">
        Checkout
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Payment Form */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-[#2E4A2E]">Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input id="expiry" placeholder="MM/YY" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" placeholder="123" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name on Card</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
              
              <Button className="w-full bg-[#2E4A2E] text-[#F2E8D5] hover:bg-[#3C2F2F]">
                Complete Purchase
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-[#2E4A2E]">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-[#3C2F2F]">Premium Subscription</span>
                <span className="text-[#2E4A2E] font-bold">$29.99</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#3C2F2F]">Tax</span>
                <span className="text-[#2E4A2E] font-bold">$3.00</span>
              </div>
              <div className="border-t border-[#2E4A2E]/20 pt-4">
                <div className="flex justify-between">
                  <span className="text-[#3C2F2F] font-bold">Total</span>
                  <span className="text-[#2E4A2E] font-bold text-xl">$32.99</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 