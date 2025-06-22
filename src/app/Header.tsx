import Link from 'next/link';
import { CartPreview } from "@/components/CartPreview";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import HeaderClient from './HeaderClient';

export default async function Header() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur border-b border-[#654C37]/10 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative">
        <HeaderClient user={user} />
        
        {/* Centered Logo / Brand */}
        <div className="flex-1 flex justify-center">
          <Link href="/" className="flex items-center gap-2 mx-auto">
            <span className="text-2xl font-bold font-serif uppercase tracking-widest" style={{ color: '#654C37', letterSpacing: '0.1em' }}>
              EXCLUSIVE LEX
            </span>
          </Link>
        </div>
        
        {/* Right: Cart, Account/Login (desktop only) */}
        <div className="hidden md:flex items-center gap-4">
          <CartPreview />
          <Link href="/cart" className="text-[#D4C7B4] hover:underline px-2 py-1 link-underline">🛒</Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/account">
                <button className="bg-[#D4C7B4] text-[#654C37] px-3 py-1 rounded text-sm button-animate">My Account</button>
              </Link>
              {/* Sign out is a client-side action, handled in HeaderClient */}
            </div>
          ) : (
             <Link href="/signin">
                <button className="bg-[#D4C7B4] text-[#654C37] px-3 py-1 rounded text-sm button-animate">Login</button>
             </Link>
          )}
        </div>
      </div>
    </header>
  );
} 