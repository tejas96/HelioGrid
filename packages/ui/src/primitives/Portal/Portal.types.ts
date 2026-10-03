import type { ReactNode } from 'react';

/** Relocates children out of their screen — sheets, modals, menus, tooltips. */
export interface PortalProps {
  children?: ReactNode;
}

/** The layer portals land in. Mount ONE at the app root (above navigation). */
export interface PortalHostProps {
  children?: ReactNode;
  /**
   * The device's bottom inset — the home-indicator band — that a float docked to the bottom edge
   * must clear. The phone root passes its safe-area inset, because this package holds no
   * safe-area library; the web clears the band in CSS and ignores it.
   */
  bottomInset?: number;
}
