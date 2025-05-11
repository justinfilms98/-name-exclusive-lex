'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/cart-context'
import { Trash2, ShoppingCart } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'

// Replace with your Stripe publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartItem {
  id: string
  title: string
  price: number
  type: 'per_watch'
  creator: {
    name: string
  }
}

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, total, clearCart } = useCart()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to load')
      
      const { error } = await stripe.redirectToCheckout({ sessionId })
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to process checkout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Your Cart</h1>
        
        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-6">Add some videos to your cart to get started</p>
            <Link href="/collections">
              <Button className="bg-[#1B4D3E] hover:bg-[#153B30]">
                Browse Collections
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg divide-y divide-white/20">
              {items.map((item) => (
                <div key={item.id} className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{item.title}</h3>
                    <p className="text-gray-400 text-sm">by {item.creator.name}</p>
                    <p className="text-gray-300 mt-1">${item.price} per watch</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <Card className="bg-black/50 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white font-medium">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tax</span>
                    <span className="text-white font-medium">${(total * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span className="text-white">Total</span>
                      <span className="text-white">${(total * 1.1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm mt-4">{error}</p>
                )}

                <Button 
                  className="w-full mt-6 bg-[#1B4D3E] hover:bg-[#153B30]"
                  onClick={handleCheckout}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Proceed to Checkout'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 