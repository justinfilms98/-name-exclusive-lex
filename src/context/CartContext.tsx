"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  videoUrl: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  isInCart: (id: number) => boolean;
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
          setItems(JSON.parse(storedCart));
        }
      } catch (err) {
        console.error('Error loading cart:', err);
      } finally {
        setIsInitialized(true);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      // Check if item already exists in cart
      if (prev.some(cartItem => cartItem.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (id: number) => {
    return items.some(item => item.id === id);
  };

  const totalItems = items.length;
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const value = {
    items,
    addItem,
    removeItem,
    clearCart,
    isInCart,
    totalItems,
    subtotal,
    tax,
    total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 