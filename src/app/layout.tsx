import './globals.css';
import Header from './Header';
import SessionProviderWrapper from './SessionProviderWrapper';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ background: '#7C745', position: 'fixed', inset: 0, zIndex: 0, width: '100vw', height: '100vh' }} />
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