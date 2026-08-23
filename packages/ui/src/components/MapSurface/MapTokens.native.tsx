import { theme } from '@heliogrid/theme';
import type { MapMarkerTone } from './MapSurface.types';

/**
 * The native half's token vocabulary — same names as the web custom properties.
 *
 * `warning` resolves to `--warning-text`, not `--warning`: a mark that carries state must clear
 * WCAG's 3:1 non-text floor, and `--warning` clears it on no background in this system.
 */
export const MAP_TONE: Record<MapMarkerTone, string> = {
  accent: theme.colors.accent,
  success: theme.colors.success,
  warning: theme.colors['warning-text'],
  danger: theme.colors.danger,
  info: theme.colors.info,
  neutral: theme.colors['text-secondary'],
};

export const MAP_PIN_COLOR: Record<'pending' | 'confirmed', string> = {
  pending: theme.colors.accent,
  confirmed: theme.colors.success,
};

export const MAP_ACCENT = theme.colors.accent;
export const MAP_INFO = theme.colors.info;
export const MAP_SURFACE = theme.colors.surface;
export const MAP_GRIDLINE = theme.colors['chart-gridline'];
