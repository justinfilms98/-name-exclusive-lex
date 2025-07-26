import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import AgeVerificationWrapper from '../components/AgeVerificationWrapper'
import Header from './Header'
import { LegalProvider } from '../context/LegalContext'
import LegalDisclaimerWrapper from '../components/LegalDisclaimerWrapper'

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
          <LegalProvider>
            <AgeVerificationWrapper>
              <Header />
              <main className="pt-14 sm:pt-16">
                {children}
              </main>
              <LegalDisclaimerWrapper />
            </AgeVerificationWrapper>
          </LegalProvider>
        </Providers>
      </body>
    </html>
  )
}
