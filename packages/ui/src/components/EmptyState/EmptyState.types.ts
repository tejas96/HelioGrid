import type { ReactNode } from 'react';

/**
 * Centred empty/error state — a soft brand bloom behind a circular icon, a headline, an
 * encouraging description and a primary action. Never leave a screen blank.
 *
 * For an error state pass a danger-tinted icon and an action labelled "Try again".
 */
export interface EmptyStateProps {
  /** line-drawing icon or large glyph */
  icon?: ReactNode;
  title: string;
  /** centred, text-secondary, max ~2 lines */
  description?: string;
  /** primary pill button */
  action?: ReactNode;
  /** soft brand glow bloom behind the icon (default on) */
  glow?: boolean;
}
