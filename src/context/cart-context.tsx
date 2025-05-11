'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface Video {
  id: string
  title: string
  description: string
  thumbnailKey: string
  price: number
  type: 'monthly' | 'yearly'
  creator: {
    name: string
    image: string
  }
  createdAt: string
  hasAccess?: boolean
  expiresAt?: string | null
}

interface CartContextType {
  items: Video[]
  addItem: (item: Video) => void
  removeItem: (id: string) => void
  clearCart: () => void
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Video[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    // Calculate total whenever items change
    const newTotal = items.reduce((sum, item) => sum + item.price, 0)
    setTotal(newTotal)
  }, [items])

  const addItem = (item: Video) => {
    setItems(prev => [...prev, item])
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setItems([])
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
} 