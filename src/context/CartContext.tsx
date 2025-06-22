"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define the shape of a single cart item
interface CartItem {
  id: string;
  name: string;
  price: number;
  thumbnail: string | null;
}

// Define the shape of the context value
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  itemCount: number;
}

// Create the context with a default undefined value
const CartContext = createContext<CartContextType | undefined>(undefined);

// Define the props for the provider component
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // On initial render, load the cart from localStorage
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('exclusiveLexCart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
      // If parsing fails, start with an empty cart
      setCartItems([]);
    }
  }, []);

  // Whenever the cartItems state changes, update localStorage
  useEffect(() => {
    localStorage.setItem('exclusiveLexCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems(prevItems => {
      // Check if item already exists to avoid duplicates
      if (prevItems.find(prevItem => prevItem.id === item.id)) {
        return prevItems;
      }
      return [...prevItems, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const itemCount = cartItems.length;

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook for consuming the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 