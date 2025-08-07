import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import AgeVerificationWrapper from '../components/AgeVerificationWrapper'
import Header from './Header'
import ConstructionBanner from '../components/ConstructionBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Exclusive Lex',
  description: 'Exclusive content platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body className={inter.className}>
        <Providers>
          <AgeVerificationWrapper>
            <ConstructionBanner />
            <Header />
            <main className="pt-14 sm:pt-16">
              {children}
            </main>
          </AgeVerificationWrapper>
        </Providers>
      </body>
    </html>
  )
}
