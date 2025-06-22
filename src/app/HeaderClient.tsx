"use client";

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, User, LogIn, LogOut } from 'lucide-react';

export default function HeaderClient() {
  const { data: session } = useSession();
  const { itemCount } = useCart();

  return (
    <div className="flex items-center space-x-6">
      <Link href="/cart" className="relative text-white hover:text-gray-300 transition-colors">
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-xs font-bold animate-pulse">
            {itemCount}
          </span>
        )}
      </Link>

      {session?.user ? (
        <>
          <Link href="/account" className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors">
            <User className="h-5 w-5" />
            <span>Account</span>
          </Link>
          <button 
            onClick={() => signOut()} 
            className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </>
      ) : (
        <Link href="/signin" className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors">
          <LogIn className="h-5 w-5" />
          <span>Sign In</span>
        </Link>
      )}
    </div>
  );
} 