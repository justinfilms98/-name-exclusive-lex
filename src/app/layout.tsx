import './globals.css';
import Header from './Header';
import { Providers } from './Providers';
import { CartProvider } from "@/context/CartContext";

export default function RootLayout({ children, pageProps }: { children: React.ReactNode, pageProps: { initialSession?: any } }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Providers initialSession={pageProps?.initialSession}>
            <Header />
            {children}
          </Providers>
        </CartProvider>
      </body>
    </html>
  );
} 