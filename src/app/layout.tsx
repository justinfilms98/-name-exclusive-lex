import './globals.css';
import Header from './Header';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabase';
import { CartProvider } from "@/context/CartContext";

export default function RootLayout({ children, pageProps }: { children: React.ReactNode, pageProps: any }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <SessionContextProvider supabaseClient={supabase} initialSession={pageProps?.initialSession}>
            <Header />
            {children}
          </SessionContextProvider>
        </CartProvider>
      </body>
    </html>
  );
} 