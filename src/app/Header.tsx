"use client";
import Link from 'next/link';
import AuthButton from '@/components/AuthButton';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-stone-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-serif text-stone-800">
              Exclusive Lex
            </Link>
          </div>
          
          <nav className="flex items-center space-x-8">
            <Link href="/collections" className="text-stone-600 hover:text-stone-800 transition-colors">
              Collections
            </Link>
            <AuthButton />
          </nav>
        </div>
      </div>
    </header>
  );
} 