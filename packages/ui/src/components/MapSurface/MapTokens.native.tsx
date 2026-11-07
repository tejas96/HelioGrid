import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import type { MapMarkerTone } from './MapSurface.types';

/**
 * The native half's token vocabulary — same names as the web custom properties.
 *
 * `warning` resolves to `--warning-text`, not `--warning`: a mark that carries state must clear
 * WCAG's 3:1 non-text floor, and `--warning` clears it on no background in this system.
 */
export const MAP_TONE: Record<MapMarkerTone, ThemeColor> = {
  accent: colors.accent,
  success: colors.success,
  warning: colors['warning-text'],
  danger: colors.danger,
  info: colors.info,
  neutral: colors['text-secondary'],
};

export const MAP_PIN_COLOR: Record<'pending' | 'confirmed', ThemeColor> = {
  pending: colors.accent,
  confirmed: colors.success,
};

export const MAP_ACCENT = colors.accent;
export const MAP_INFO = colors.info;
// biome-ignore lint/plugin/raw-white: over-media — a chip, a thumbnail or a control drawn over a photograph or a map
export const MAP_SURFACE = colors.surface;
export const MAP_GRIDLINE = colors['chart-gridline'];
