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
    <main className="container mx-auto px-4 py-8 pt-28" style={{ background: '#7C745', minHeight: '100vh' }}>
      <h1 className="text-3xl font-bold text-[#F2E0CF] mb-8 text-reveal">Shopping Cart</h1>

      {/* Checkout Progress */}
      <div className="checkout-progress mb-12">
        <div className="checkout-step active">1</div>
        <div className="checkout-step">2</div>
        <div className="checkout-step">3</div>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 premium-card max-w-md mx-auto p-8 text-reveal">
          <div className="w-24 h-24 mx-auto mb-6 text-[#F2E0CF]">
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-[#F2E0CF] text-xl mb-6">Your cart is empty</p>
          <button
            onClick={() => router.push("/collections")}
            className="bg-[#654C37] text-[#F2E0CF] px-8 py-3 rounded hover:bg-[#654C37]/90 transition-all duration-300 hover-lift focus-ring border border-[#C9BBA8]/20 shadow-lg"
          >
            Browse Collections
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={item.id}
                className="premium-card flex items-center gap-4 p-4 text-reveal"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative w-24 h-24 overflow-hidden rounded group">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title} 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#F2E0CF]">{item.title}</h3>
                  {item.price !== undefined && <p className="text-[#C9BBA8] font-medium">${item.price.toFixed(2)}</p>}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-300 hover:text-red-100 transition-colors duration-300 focus-ring"
                  aria-label="Remove item"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}

            {/* You might also like section */}
            <div className="premium-card p-6 mt-8 text-reveal">
              <h3 className="text-xl font-semibold text-[#F2E0CF] mb-4">You might also like</h3>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="aspect-video rounded overflow-hidden mb-2">
                      <div className="w-full h-full bg-[#654C37] animate-pulse"></div>
                    </div>
                    <p className="text-[#F2E0CF]/80 text-sm group-hover:text-[#F2E0CF] transition-colors">Premium Collection {i}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="premium-card p-6 text-reveal">
            <h2 className="text-xl font-semibold text-[#F2E0CF] mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-[#F2E0CF]">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#F2E0CF]">
                <span>Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-[#F2E0CF]/20 pt-4 mt-4">
                <div className="flex justify-between font-semibold text-[#F2E0CF]">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (cartItems.some(item => !item.price || item.price <= 0)) {
                  alert('One or more items have no price set. Please contact support.');
                  return;
                }
                handleCheckout(cartItems, router);
              }}
              className="w-full bg-[#654C37] text-[#F2E0CF] px-6 py-3 rounded font-semibold hover:bg-[#654C37]/90 transition-all duration-300 hover-lift focus-ring border border-[#C9BBA8]/20 shadow-lg"
              disabled={cartItems.some(item => !item.price || item.price <= 0)}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </main>
  );
} 