import './globals.css';
import Header from './Header';
import { Providers } from './Providers';
import { CartProvider } from "@/context/CartContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Providers>
            <Header />
            {children}
          </Providers>
        </CartProvider>
      </body>
    </html>
  );
} 