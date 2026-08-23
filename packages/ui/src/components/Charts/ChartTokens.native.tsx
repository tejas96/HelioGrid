import { theme } from '@heliogrid/theme';
import type { TextColor } from '../../primitives/Text/Text.types';
import { chartSlot } from './chart-palette';
import type { ProvenanceColorKey } from './chart-provenance';

/**
 * The native half of the chart vocabulary: every colour a chart may draw with, resolved from
 * the generated theme. Same token names as the web `var(--…)` custom properties.
 */

const SERIES = [
  theme.colors['chart-1'],
  theme.colors['chart-2'],
  theme.colors['chart-3'],
  theme.colors['chart-4'],
  theme.colors['chart-5'],
  theme.colors['chart-6'],
  theme.colors['chart-7'],
  theme.colors['chart-8'],
] as const;

/** The palette colour for a zero-based series index — `--chart-1` … `--chart-8`, wrapping. */
export function chartColor(index: number): string {
  return SERIES[chartSlot(index) - 1] ?? theme.colors['chart-1'];
}

export const CHART_GRIDLINE = theme.colors['chart-gridline'];

export const PROVENANCE_MARK: Record<ProvenanceColorKey, string> = {
  success: theme.colors.success,
  'success-text': theme.colors['success-text'],
  'info-text': theme.colors['info-text'],
  'warning-text': theme.colors['warning-text'],
  'text-tertiary': theme.colors['text-tertiary'],
  'mark-subtle': theme.colors['mark-subtle'],
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
