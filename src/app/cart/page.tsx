"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Mock cart item type - replace with your actual type
type CartItem = {
  id: string | number;
  title: string;
  price?: number;
  description?: string;
  thumbnail: string;
};

async function handleCheckout(cartItems: CartItem[], router: any) {
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || 'Checkout failed');
    }
  } catch (err) {
    alert('Checkout failed');
  }
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cart');
      if (stored) {
        setCartItems(JSON.parse(stored));
        return;
      }
    }
    // fallback mock data
    setCartItems([
      {
        id: "1",
        title: "Premium Collection Access",
        price: 29.99,
        thumbnail: "/placeholder.jpg",
      },
      {
        id: "2",
        title: "VIP Membership - Monthly",
        price: 19.99,
        thumbnail: "/placeholder.jpg",
      },
    ]);
  }, []);

  const removeItem = (id: string | number) => {
    setCartItems(items => {
      const updated = items.filter(item => item.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-900 mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <button
            onClick={() => router.push("/collections")}
            className="bg-green-900 text-white px-6 py-2 rounded hover:bg-green-800 transition-colors"
          >
            Browse Collections
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 bg-white rounded-lg shadow-md p-4"
              >
                <div className="w-24 h-24 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  {item.price !== undefined && <p className="text-green-900 font-medium">${item.price.toFixed(2)}</p>}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCheckout(cartItems, router)}
                className="w-full bg-green-900 text-white px-6 py-3 rounded font-semibold hover:bg-green-800 transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 