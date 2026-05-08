import type { Metadata, Viewport } from 'next';
import { Permanent_Marker } from 'next/font/google';
import PassFrame from '@/components/PassFrame';
import './globals.css';

const marker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marker',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hall Pass Oracle — Free Period',
  description:
    'Flush for your odds. The toilet decides whether you can go to the bathroom.',
  openGraph: {
    title: 'Hall Pass Oracle',
    description: 'Flush for your odds.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hall Pass Oracle',
    description: 'Flush for your odds.',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={marker.variable}>
      <body className="bg-black text-white antialiased">
        <PassFrame>{children}</PassFrame>
      </body>
    </html>
  );
}
