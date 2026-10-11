import './globals.css';
import type { Metadata, Viewport } from 'next';
import Starfield from '@/components/Starfield';
import { fontVariables } from './fonts';

export const metadata: Metadata = {
  title: { default: 'Umbra', template: '%s · Umbra' },
  description: 'Find the best place and time to see the stars tonight.',
};
export const viewport: Viewport = { themeColor: '#05070d' };

// Each page renders its own TopBar, since the main page puts its controls in it.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <Starfield />
        {children}
      </body>
    </html>
  );
}
