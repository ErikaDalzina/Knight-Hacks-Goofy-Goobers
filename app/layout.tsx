import './globals.css';
import type { Metadata, Viewport } from 'next';
import { fontVariables } from './fonts';
export const metadata: Metadata = {
  title: { default: 'Umbra', template: '%s · Umbra' },
  description: 'Find the best place and time to see the stars tonight.',
};
export const viewport: Viewport = { themeColor: '#05070d' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={fontVariables}><body>{children}</body></html>;
}
