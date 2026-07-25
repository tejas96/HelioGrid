import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@heliogrid/tokens/tokens.css';
import '@heliogrid/tokens/base.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'HelioGrid',
  description: 'CRM, surveys, 3D design and proposals for solar EPCs.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
