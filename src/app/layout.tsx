import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import AgeVerificationWrapper from '../components/AgeVerificationWrapper'
import Header from './Header'
import ClientErrorHandler from '../components/ClientErrorHandler'
import ChunkRecovery from '../components/ChunkRecovery'

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var hasReloaded = sessionStorage.getItem('__chunk_reload_attempted');
                var urlParams = new URLSearchParams(window.location.search);
                
                function shouldRecover(errorText) {
                  if (!errorText) return false;
                  var text = String(errorText).toLowerCase();
                  return text.includes('chunkloaderror') ||
                         text.includes('loading chunk') ||
                         text.includes('failed to fetch') ||
                         text.includes('loading failed') ||
                         text.includes('networkerror');
                }
                
                function recover() {
                  if (hasReloaded === 'true') {
                    sessionStorage.removeItem('__chunk_reload_attempted');
                    return;
                  }
                  sessionStorage.setItem('__chunk_reload_attempted', 'true');
                  if (urlParams.get('__r') !== '1') {
                    window.location.replace(window.location.href.split('?')[0] + '?__r=1');
                  } else {
                    window.location.reload(true);
                  }
                }
                
                window.addEventListener('error', function(e) {
                  if (shouldRecover(e.message || e.filename)) {
                    recover();
                  }
                }, true);
                
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e.reason;
                  var msg = reason && (reason.message || String(reason));
                  if (shouldRecover(msg)) {
                    recover();
                  }
                });
                
                setTimeout(function() {
                  var body = document.body;
                  var hasReactContent = body && (
                    body.children.length > 2 ||
                    body.querySelector('[data-reactroot]') ||
                    body.querySelector('main') ||
                    body.textContent.trim().length > 100
                  );
                  if (!hasReactContent && !hasReloaded && urlParams.get('__r') !== '1') {
                    recover();
                  }
                }, 2000);
              })();
            `,
          }}
        />
        <ChunkRecovery />
        <ClientErrorHandler />
        <Providers>
          <AgeVerificationWrapper>
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
