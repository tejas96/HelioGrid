import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { ViewStyle } from 'react-native';
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

const DISABLED = theme.colors['canvas-sunken'];

const COLORS: Record<Ground, GroundColors> = {
  page: {
    // biome-ignore lint/plugin/raw-white: ground — the ground itself, and Surface, which sets it
    ground: theme.colors.surface,
    controlFill: theme.colors.fill,
    controlFillDisabled: DISABLED,
  },
  tile: {
    ground: theme.colors.fill,
    // biome-ignore lint/plugin/raw-white: ground — the ground itself, and Surface, which sets it
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

/**
 * The tile's look at rest (`F7-49`) — grey on the white page, no shadow — the web half's tiles
 * list. The ONE place a phone tile is drawn: a tile spreads it first and keeps only its own radius,
 * padding and rings, and wraps its content in `GroundProvider ground="tile"`.
 */
export const tileSurface = {
  backgroundColor: theme.colors.fill,
  shadowOpacity: 0,
  elevation: 0,
} satisfies ViewStyle;
