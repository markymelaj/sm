import type { Metadata, Viewport } from 'next';

import { RegisterServiceWorker } from '@/components/pwa/register-service-worker';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portal Santa Magdalena',
  description: 'Portal operativo para obra de electrificación Santa Magdalena.',
  manifest: '/manifest.webmanifest',
  themeColor: '#0ea5e9',
  appleWebApp: {
    capable: true,
    title: 'Santa Magdalena',
    statusBarStyle: 'black-translucent'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
