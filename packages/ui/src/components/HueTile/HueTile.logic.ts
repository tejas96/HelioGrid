import { colors } from '../../primitives/Color/colors';
import type { ShellGlyphSize } from '../AppShell/AppShell.types';
import { type HueTint, hueTintOf, isCategoryHue } from '../Avatar/Avatar.logic';
import type { HueTileProps, HueTileSize, HueTileTone } from './HueTile.types';

/** The glyph's side in each tile: small on a group head, large on a hero or a sheet's moment. */
export const HUE_TILE_GLYPH: Readonly<Record<HueTileSize, ShellGlyphSize>> = {
  24: 'sm',
  32: 'md',
  34: 'md',
  36: 'md',
  40: 'md',
  44: 'md',
  48: 'lg',
  56: 'xl',
};

const TONE_TINT: Readonly<Record<HueTileTone, HueTint>> = {
  danger: { bg: colors['danger-bg'], fg: colors['danger-text'] },
  warning: { bg: colors['warning-bg'], fg: colors['warning-text'] },
  success: { bg: colors['success-bg'], fg: colors['success-text'] },
  accent: { bg: colors['accent-subtle'], fg: colors['accent-text'] },
  neutral: { bg: colors['neutral-bg'], fg: colors['neutral-text'] },
};

/** The phone's wash and ink for a tile: its category hue's pair, or its tone's. */
export function hueTileTintOf(hue: HueTileProps['hue']): HueTint {
  return isCategoryHue(hue) ? hueTintOf(hue) : TONE_TINT[hue];
}
