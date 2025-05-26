import './globals.css';
import Header from './Header';
import SessionProviderWrapper from './SessionProviderWrapper';
import { CartProvider } from "@/context/CartContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <SessionProviderWrapper>
            <Header />
            {children}
          </SessionProviderWrapper>
        </CartProvider>
      </body>
    </html>
  );
} 