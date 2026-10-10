import './globals.css';
import type { Metadata, Viewport } from 'next';
import { fontVariables } from './fonts';
import Link from 'next/link';
export const metadata: Metadata = {
  title: { default: 'Umbra', template: '%s · Umbra' },
  description: 'Find the best place and time to see the stars tonight.',
};
export const viewport: Viewport = { themeColor: '#05070d' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={fontVariables}>
        <body>
        <header
            style={{
                height: 56,
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                background: 'var(--panel)',
                borderBottom: '1px solid var(--line)',
                position: 'relative',
                zIndex: 1000,
            }}
        >
            <Link href="/" style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
                Umbra
            </Link>
        </header>
        {children}
        </body>
        </html>
    );
}
