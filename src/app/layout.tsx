import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import AgeVerificationWrapper from '../components/AgeVerificationWrapper'
import Header from './Header'

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
            {/* Temporary Global Banner Warning */}
            <div className="bg-yellow-200 text-yellow-900 text-sm py-2 px-4 text-center z-50">
              🚧 <strong>Heads up:</strong> We are currently upgrading our checkout system. 
              Please only purchase one collection at a time. Multi-item checkout access is temporarily unavailable.
            </div>
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
