import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { Ground } from './Ground.types';

/** What a control reads from what holds it — the web half's two custom properties. */
export interface GroundColors {
  /** The colour behind a control: what a knob on a track, or a tint, sits over. */
  ground: string;
  /** The fill a control takes here — the opposite of the ground. */
  controlFill: string;
  /** The fill a disabled control takes, the same on every ground — see the web half. */
  controlFillDisabled: string;
}

const DISABLED = theme.colors['surface-form'];

const COLORS: Record<Ground, GroundColors> = {
  page: {
    ground: theme.colors.surface,
    controlFill: theme.colors['bg-well'],
    controlFillDisabled: DISABLED,
  },
  tile: {
    ground: theme.colors['canvas-sunken'],
    controlFill: theme.colors.surface,
    controlFillDisabled: DISABLED,
  },
};

/* The page by default. Every float renders through `Portal` at the host the app mounts, outside
   any tile, so a sheet or a menu opened from inside a tile reads the page without being told. */
const GroundContext = createContext<Ground>('page');

/** Wrapped around a ground's content by the surface that IS the ground — a tile, a `Surface`. */
export function GroundProvider({ ground, children }: { ground: Ground; children?: ReactNode }) {
  return <GroundContext.Provider value={ground}>{children}</GroundContext.Provider>;
}

export function useGround(): GroundColors {
  return COLORS[useContext(GroundContext)];
}
