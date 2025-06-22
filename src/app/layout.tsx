import { Inter } from 'next/font/google';
import './globals.css';
import Header from './Header';
import SessionProviderWrapper from './SessionProviderWrapper';
import { CartProvider } from '@/context/CartContext';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <CartProvider>
            <Header />
            {children}
          </CartProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
