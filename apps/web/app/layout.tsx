import { UI_SOURCE_LOCALE } from '@heliogrid/contracts';
import { LANGUAGE_META } from '@heliogrid/i18n';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';
import '@heliogrid/theme/tokens.css';
import '@heliogrid/theme/base.css';
import '@heliogrid/ui/styles.css';
import './globals.css';
import { APPEARANCE_BOOT } from '../lib/appearance';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'HelioGrid',
  description: 'CRM, surveys, 3D design and proposals for solar EPCs.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The page runs edge to edge behind a phone's bars; content keeps clear with env(safe-area-inset-*).
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The SOURCE locale, because the server has no per-user language until M01 lands a
    // session. Providers moves both attributes on a client switch.
    // The boot script sets `data-theme` before hydration, so React is told the attribute may differ.
    <html
      lang={LANGUAGE_META[UI_SOURCE_LOCALE].tag}
      dir={LANGUAGE_META[UI_SOURCE_LOCALE].dir}
      suppressHydrationWarning
    >
      <head>
        <Script id="hg-appearance" strategy="beforeInteractive">
          {APPEARANCE_BOOT}
        </Script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
