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
      <body className={inter.className}>
        <Providers>
          <LegalProvider>
            <AgeVerificationWrapper>
              <Header />
              {children}
              <LegalDisclaimerWrapper />
            </AgeVerificationWrapper>
          </LegalProvider>
        </Providers>
      </body>
    </html>
  )
}
