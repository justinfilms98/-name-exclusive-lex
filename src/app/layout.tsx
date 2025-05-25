import './globals.css';
import Header from './Header';
import SessionProviderWrapper from './SessionProviderWrapper';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          html, body, #__next, main, div {
            background-color: #7C745 !important;
            min-height: 100vh !important;
          }
        `}</style>
      </head>
      <body>
        <div style={{ background: '#7C745', position: 'fixed', inset: 0, zIndex: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SessionProviderWrapper>
            <Header />
            {children}
          </SessionProviderWrapper>
        </div>
      </body>
    </html>
  );
} 