import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Stargazing Hackathon',
  description: 'Find the best time and place for stargazing.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
