import { UI_SOURCE_LOCALE } from '@heliogrid/contracts';
import { LANGUAGE_META } from '@heliogrid/i18n';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@heliogrid/theme/tokens.css';
import '@heliogrid/theme/base.css';
import '@heliogrid/ui/styles.css';
import './globals.css';
import { Providers } from './providers';

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
    // The SOURCE locale, because the server has no per-user language until M01 lands a
    // session. Providers moves both attributes on a client switch.
    <html lang={LANGUAGE_META[UI_SOURCE_LOCALE].tag} dir={LANGUAGE_META[UI_SOURCE_LOCALE].dir}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
