import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

export interface TenantMarkProps {
  /** The tenant's logo: a URL string, or a ready node. Omit and the monogram renders. */
  logo?: string | ReactNode;
  /**
   * The tenant's name. Also the monogram source, and — when the mark stands alone — the accessible
   * name of its logo or monogram: the mark IS the identity, so it is named by the name alone.
   */
  name: string;
  /** Mark height in px. 32 in a top bar, 40–48 on a page. */
  size?: number;
  /** Set false for the mark alone — a phone bar that already carries a screen title. */
  showName?: boolean;
  /** One line of micro text under the name — a plan, a city, a reference. */
  meta?: string;
  radius?: number;
}

export type TenantHeaderAlign = 'left' | 'center';

export interface TenantHeaderProps {
  logo?: string | ReactNode;
  name: string;
  /** What this page is, in the customer's words — "Your solar proposal · 8.4 kWp". */
  caption?: TranslatedText;
  size?: number;
  actions?: ReactNode;
  align?: TenantHeaderAlign;
}
