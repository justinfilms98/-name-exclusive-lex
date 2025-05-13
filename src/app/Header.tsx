import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full flex items-center justify-between px-8 py-4 bg-transparent">
      <nav className="flex items-center gap-6">
        <Link href="/collections" className="text-green-900 font-semibold hover:underline">Collections</Link>
        <Link href="/vip" className="text-green-900 font-semibold hover:underline">VIP</Link>
        <Link href="/admin" className="text-green-900 font-semibold hover:underline">Admin</Link>
      </nav>
      <div className="flex-1 flex justify-center">
        <Link href="/" className="text-2xl font-bold text-green-900">Exclusive Lex</Link>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/cart" className="text-green-900 hover:underline">🛒</Link>
        <Link href="/account">
          <button className="bg-green-900 text-white px-4 py-1 rounded">My Account</button>
        </Link>
      </div>
    </header>
  );
} 