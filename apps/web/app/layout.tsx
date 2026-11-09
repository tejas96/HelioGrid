import { LANGUAGES, UI_SOURCE_LOCALE } from '@heliogrid/contracts';
import type { Metadata, Viewport } from 'next';
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
    <html lang={UI_SOURCE_LOCALE} dir={LANGUAGES[UI_SOURCE_LOCALE].dir} suppressHydrationWarning>
      <body>
        {/* Runs while the page is parsed, before anything under it paints: no flash of the wrong
            scheme. React never renders into it. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the theme boot — a fixed string from lib/appearance.ts, no input in it */}
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
