import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { ViewStyle } from 'react-native';
import type { ThemeColor } from '../Color/colors';
import { colors } from '../Color/colors';
import type { Ground } from './Ground.types';

/** What a control reads from what holds it — the web half's two custom properties. */
export interface GroundColors {
  /** The colour behind a control: what a knob on a track, or a tint, sits over. */
  ground: ThemeColor;
  /** The fill a control takes here — the opposite of the ground. */
  controlFill: ThemeColor;
  /** The fill a disabled control takes, the same on every ground — see the web half. */
  controlFillDisabled: ThemeColor;
}

const DISABLED = colors['canvas-sunken'];

const COLORS: Record<Ground, GroundColors> = {
  page: {
    ground: colors.canvas,
    // biome-ignore lint/plugin/raw-white: ground — a control on the page is the card colour
    controlFill: colors.surface,
    controlFillDisabled: DISABLED,
  },
  tile: {
    // biome-ignore lint/plugin/raw-white: ground — a tile is the white card on the page
    ground: colors.surface,
    controlFill: colors.fill,
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
 * The tile's look at rest: the white card on the page, a hairline edge — the web half's tiles
 * list. The ONE place a phone tile is drawn: a tile spreads it first and keeps only its own radius,
 * padding and rings, and wraps its content in `GroundProvider ground="tile"`.
 */
export const tileSurface = {
  // biome-ignore lint/plugin/raw-white: ground — a tile is the white card on the page
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors['line-soft'],
  shadowOpacity: 0,
  elevation: 0,
} satisfies ViewStyle;
