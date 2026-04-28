import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google';
import I18nProvider from '@/components/I18nProvider';
import './globals.css';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  display: 'swap',
});

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  weight: ['300', '400'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mnemo',
  description: 'Capture a thought. It returns when the time is right.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Mnemo',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#18160f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-mnemo-bg text-mnemo-ink font-dm-sans">
        <I18nProvider>{children}</I18nProvider>
        <Script id="mnemo-sw-register" strategy="afterInteractive">
          {process.env.NODE_ENV === 'production'
            ? `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
                });
              }
            `
            : `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function (regs) {
                  regs.forEach(function (r) { r.unregister(); });
                });
              }
              if (typeof caches !== 'undefined') {
                caches.keys().then(function (keys) {
                  keys.forEach(function (k) { caches.delete(k); });
                });
              }
            `}
        </Script>
      </body>
    </html>
  );
}
