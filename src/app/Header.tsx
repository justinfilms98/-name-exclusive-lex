import HeaderClient from './HeaderClient';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-sm z-40 border-b border-stone-200">
      <HeaderClient />
    </header>
  );
} 