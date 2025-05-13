"use client";
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="w-full px-4 py-4 bg-transparent">
      <div className="flex items-center justify-between">
        {/* Hamburger for mobile */}
        <button
          className="md:hidden text-green-900 text-2xl"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
        {/* Centered logo/title */}
        <div className="flex-1 flex justify-center md:justify-center">
          <Link href="/" className="text-2xl font-bold text-green-900">Exclusive Lex</Link>
        </div>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/collections" className="text-green-900 font-semibold hover:underline">Collections</Link>
          <Link href="/vip" className="text-green-900 font-semibold hover:underline">VIP</Link>
          <Link href="/admin" className="text-green-900 font-semibold hover:underline">Admin</Link>
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/cart" className="text-green-900 hover:underline">🛒</Link>
          <Link href="/account">
            <button className="bg-green-900 text-white px-4 py-1 rounded">My Account</button>
          </Link>
        </div>
      </div>
      {/* Mobile nav menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-4 items-center bg-white rounded shadow p-4">
          <Link href="/collections" className="text-green-900 font-semibold hover:underline w-full text-center" onClick={() => setMenuOpen(false)}>Collections</Link>
          <Link href="/vip" className="text-green-900 font-semibold hover:underline w-full text-center" onClick={() => setMenuOpen(false)}>VIP</Link>
          <Link href="/admin" className="text-green-900 font-semibold hover:underline w-full text-center" onClick={() => setMenuOpen(false)}>Admin</Link>
          <Link href="/cart" className="text-green-900 hover:underline w-full text-center" onClick={() => setMenuOpen(false)}>🛒 Cart</Link>
          <Link href="/account" className="w-full text-center" onClick={() => setMenuOpen(false)}>
            <button className="bg-green-900 text-white px-4 py-1 rounded w-full">My Account</button>
          </Link>
        </div>
      )}
    </header>
  );
} 