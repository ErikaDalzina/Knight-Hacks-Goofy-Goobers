import { Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';

// Loaded once here and exposed as CSS variables on <html> (see app/layout.tsx).
// Hanken Grotesk is a variable font, so it needs no weights; IBM Plex Mono does.
const sans = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const fontVariables = `${sans.variable} ${mono.variable}`;
