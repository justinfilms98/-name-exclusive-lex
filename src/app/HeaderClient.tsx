"use client";

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CartPreview } from '@/components/CartPreview';
import { signOut as supabaseSignOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function HeaderClient() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  const handleSignOut = async () => {
    await supabaseSignOut();
    await nextAuthSignOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* Desktop Layout - Account/Login only */}
      <div className="hidden md:flex items-center gap-2">
        {user ? (
          <>
            <Link href="/account" legacyBehavior>
              <a className="bg-[#D4C7B4] text-[#654C37] px-3 py-1 rounded text-sm button-animate">My Account</a>
            </Link>
            <button onClick={handleSignOut} className="bg-transparent text-[#654C37] px-3 py-1 rounded text-sm hover:underline">
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/signin">
            <button className="bg-[#D4C7B4] text-[#654C37] px-3 py-1 rounded text-sm button-animate">Login</button>
          </Link>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex items-center gap-4">
        <CartPreview />
        
        {/* Mobile icons */}
        <Link href="/cart" className="text-[#D4C7B4] hover:underline px-2 py-1 link-underline">🛒</Link>
        <Link href="/collections" className="text-[#D4C7B4] hover:underline px-2 py-1 link-underline">📚</Link>
        
        {user ? (
          <div className="flex items-center gap-2">
            <Link href="/account" legacyBehavior>
              <a className="bg-[#D4C7B4] text-[#654C37] px-3 py-1 rounded text-sm button-animate">My Account</a>
            </Link>
            <button onClick={handleSignOut} className="bg-transparent text-[#654C7B] px-3 py-1 rounded text-sm hover:underline">
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