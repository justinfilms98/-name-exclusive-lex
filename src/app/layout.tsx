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
                try {
                  var hasReloaded = sessionStorage.getItem('__chunk_reload_attempted');
                  var urlParams = new URLSearchParams(window.location.search);
                  
                  function shouldRecover(errorText) {
                    if (!errorText) return false;
                    var text = String(errorText).toLowerCase();
                    return text.includes('chunkloaderror') ||
                           text.includes('loading chunk') ||
                           text.includes('failed to fetch') ||
                           text.includes('loading failed') ||
                           text.includes('networkerror') ||
                           text.includes('importing a module script failed');
                  }
                  
                  function recover() {
                    if (hasReloaded === 'true') {
                      sessionStorage.removeItem('__chunk_reload_attempted');
                      return;
                    }
                    sessionStorage.setItem('__chunk_reload_attempted', 'true');
                    var currentUrl = window.location.href.split('?')[0];
                    if (urlParams.get('__r') !== '1') {
                      window.location.replace(currentUrl + '?__r=1');
                    } else {
                      window.location.reload();
                    }
                  }
                  
                  window.addEventListener('error', function(e) {
                    var errorMsg = e.message || e.filename || '';
                    console.error('[ChunkRecovery Script] Error detected:', errorMsg);
                    if (shouldRecover(errorMsg)) {
                      console.warn('[ChunkRecovery Script] Attempting recovery...');
                      recover();
                    }
                  }, true);
                  
                  window.addEventListener('unhandledrejection', function(e) {
                    var reason = e.reason;
                    var msg = reason && (reason.message || String(reason));
                    console.error('[ChunkRecovery Script] Unhandled rejection:', msg);
                    if (shouldRecover(msg)) {
                      console.warn('[ChunkRecovery Script] Attempting recovery...');
                      recover();
                    }
                  });
                  
                  setTimeout(function() {
                    var body = document.body;
                    if (!body) return;
                    var hasReactContent = body.children.length > 2 ||
                                         body.querySelector('main') ||
                                         (body.textContent && body.textContent.trim().length > 100);
                    if (!hasReactContent && hasReloaded !== 'true' && urlParams.get('__r') !== '1') {
                      console.warn('[ChunkRecovery Script] Page appears blank, attempting recovery...');
                      recover();
                    }
                  }, 3000);
                } catch (err) {
                  console.error('[ChunkRecovery Script] Script error:', err);
                }
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
