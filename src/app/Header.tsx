import Link from 'next/link';
import { CartPreview } from "@/components/CartPreview";
import HeaderClient from './HeaderClient';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur border-b border-[#654C37]/10 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative">
        {/* Mobile menu */}
        <div className="md:hidden">
          <HeaderClient />
        </div>
        
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* Left side - Collections */}
          <div className="flex items-center gap-6">
            <Link href="/collections" className="text-[#654C37] hover:underline px-3 py-1 text-sm font-medium">
              Collections
            </Link>
          </div>
          
          {/* Centered Logo / Brand */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="flex items-center gap-2 mx-auto">
              <span className="text-2xl font-bold font-serif uppercase tracking-widest" style={{ color: '#654C37', letterSpacing: '0.1em' }}>
                EXCLUSIVE LEX
              </span>
            </Link>
          </div>
          
          {/* Right side - Cart and Account */}
          <div className="flex items-center gap-4">
            <CartPreview />
            <HeaderClient />
          </div>
        </div>
      </div>
    </header>
  );
} 