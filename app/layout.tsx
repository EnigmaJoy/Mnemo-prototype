// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

const cormorant = Cormorant_Garamond({
  weight:   ['300', '400'],
  style:    ['normal', 'italic'],
  subsets:  ['latin'],
  variable: '--font-cormorant',
  display:  'swap',
});

const dmSans = DM_Sans({
  weight:   ['300', '400', '500'],
  subsets:  ['latin'],
  variable: '--font-dm-sans',
  display:  'swap',
});

const dmMono = DM_Mono({
  weight:   ['300', '400'],
  subsets:  ['latin'],
  variable: '--font-dm-mono',
  display:  'swap',
});

export const metadata: Metadata = {
  title:       'Mnemo',
  description: 'A personal memory app that resurfaces your thoughts at the right moment.',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'black-translucent',
    title:          'Mnemo',
  },
  icons: {
    icon:  '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor:   '#18160f',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body className="min-h-screen bg-mnemo-bg">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
