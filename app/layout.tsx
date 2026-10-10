import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Stargazing Hackathon',
  description: 'Find the best time and place for stargazing.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#0b1026',
          color: '#e8ecff',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <header
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            background: '#141a3a',
            borderBottom: '1px solid #232b52',
            position: 'relative',
            zIndex: 1000,
          }}
        >
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
            Stargazing Hackathon
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
