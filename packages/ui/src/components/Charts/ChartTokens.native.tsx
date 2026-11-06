import type { ThemeColor } from '../../primitives/Color/colors';
import { colors } from '../../primitives/Color/colors';
import type { TextColor } from '../../primitives/Text/Text.types';
import { chartSlot } from './chart-palette';
import type { ProvenanceColorKey } from './chart-provenance';

/**
 * The native half of the chart vocabulary: every colour a chart may draw with, resolved from
 * the generated theme. Same token names as the web `var(--…)` custom properties.
 */

const SERIES = [
  colors['chart-1'],
  colors['chart-2'],
  colors['chart-3'],
  colors['chart-4'],
  colors['chart-5'],
  colors['chart-6'],
  colors['chart-7'],
  colors['chart-8'],
] as const;

/** The palette colour for a zero-based series index — `--chart-1` … `--chart-8`, wrapping. */
export function chartColor(index: number): ThemeColor {
  return SERIES[chartSlot(index) - 1] ?? colors['chart-1'];
}

export const CHART_GRIDLINE = colors['chart-gridline'];

export const PROVENANCE_MARK: Record<ProvenanceColorKey, ThemeColor> = {
  success: colors.success,
  'success-text': colors['success-text'],
  'info-text': colors['info-text'],
  'warning-text': colors['warning-text'],
  'text-tertiary': colors['text-tertiary'],
  'mark-subtle': colors['mark-subtle'],
};

/** The Text primitive's colour role for a provenance word colour. */
export const PROVENANCE_TEXT: Record<ProvenanceColorKey, TextColor> = {
  success: 'success',
  'success-text': 'success',
  'info-text': 'info',
  'warning-text': 'warning',
  'text-tertiary': 'tertiary',
  'mark-subtle': 'tertiary',
};
