import type { ReactNode } from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** The sizing ladder, px/dp. One declaration for both platforms (Icon.css mirrors it). */
export const ICON_SIZE: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export interface IconProps {
  /** The glyph — an inline SVG element. It inherits currentColor; it never sets its own palette. */
  children: ReactNode;
  size?: IconSize;
  /**
   * Accessible name. OMIT for decorative icons — they are hidden from assistive tech.
   * Set it when the icon is the only carrier of meaning (an icon-only Pressable child).
   */
  label?: string;
}
