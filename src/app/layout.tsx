import "./globals.css";
import type { Metadata } from "next";
import Header from "./Header";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Exclusive Lex",
  description: "Exclusive content access",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
