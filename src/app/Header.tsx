import Link from 'next/link';
import { CartPreview } from "@/components/CartPreview";
import HeaderClient from './HeaderClient';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur border-b border-[#654C37]/10 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative">
        <div className="md:hidden">
          {/* Mobile menu could be triggered here, handled by HeaderClient */}
          <HeaderClient />
        </div>
        
        {/* Centered Logo / Brand */}
        <div className="flex-1 flex justify-center">
          <Link href="/" className="flex items-center gap-2 mx-auto">
            <span className="text-2xl font-bold font-serif uppercase tracking-widest" style={{ color: '#654C37', letterSpacing: '0.1em' }}>
              EXCLUSIVE LEX
            </span>
          </Link>
        </div>
        
        {/* Right-side container */}
        <div className="flex items-center gap-4">
           {/* Cart and Account/Login for desktop, handled by HeaderClient */}
           <div className="hidden md:flex">
             <HeaderClient />
           </div>
        </div>
      </div>
    </header>
  );
} 