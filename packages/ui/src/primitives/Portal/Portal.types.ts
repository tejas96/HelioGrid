import type { ReactNode } from 'react';

/** Relocates children out of their screen — sheets, modals, menus, tooltips. */
export interface PortalProps {
  children?: ReactNode;
}

/** The layer portals land in. Mount ONE at the app root (above navigation). */
export interface PortalHostProps {
  children?: ReactNode;
}
