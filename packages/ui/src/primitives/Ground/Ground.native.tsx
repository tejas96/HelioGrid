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
   any tile, so it never inherits a tile's ground; a sheet, a modal or a panel is white, as on the
   web, and says so itself (`OverlayBody`, `Modal`). */
const GroundContext = createContext<Ground>('page');

/** Wrapped around a ground's content by the surface that IS the ground — a tile, a `Surface`. */
export function GroundProvider({ ground, children }: { ground: Ground; children?: ReactNode }) {
  return <GroundContext.Provider value={ground}>{children}</GroundContext.Provider>;
}

export function useGround(): GroundColors {
  return COLORS[useContext(GroundContext)];
}

/**
 * The tile's look at rest: the card colour on the page, a hairline edge and a soft lift — the web half's tiles
 * list. The ONE place a phone tile is drawn: a tile spreads it first and keeps only its own radius,
 * padding and rings, and wraps its content in `GroundProvider ground="tile"`.
 */
export const tileSurface = {
  // biome-ignore lint/plugin/raw-white: ground — a tile is the white card on the page
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors['line-soft'],
  /* The web's glass lift: a soft shadow under the pane. The phone draws no frost — a static
     style cannot mix a system colour — so the lift alone carries the depth. */
  shadowColor: colors.ink,
  shadowOpacity: 0.07,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
} satisfies ViewStyle;
