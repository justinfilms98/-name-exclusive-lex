"use client";

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CartPreview } from '@/components/CartPreview';

export default function HeaderClient() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <>
      {/* Combined Desktop and Mobile */}
      <div className="flex items-center gap-4">
        <CartPreview />
        <Link href="/cart" className="text-[#D4C7B4] hover:underline px-2 py-1 link-underline md:hidden">🛒</Link> {/* Mobile Cart Icon */}
        
        {user ? (
          <div className="flex items-center gap-2">
            <Link href="/account">
              <button className="bg-[#D4C7B4] text-[#654C37] px-3 py-1 rounded text-sm button-animate">My Account</button>
            </Link>
            <button onClick={() => signOut()} className="bg-transparent text-[#654C37] px-3 py-1 rounded text-sm hover:underline">
              Sign Out
            </button>
          </div>
        ) : (
           <Link href="/signin">
              <button className="bg-[#D4C7B4] text-[#654C37] px-3 py-1 rounded text-sm button-animate">Login</button>
           </Link>
        )}
      </div>
    </>
  );
} 